import { Controller, Post, Get, UseInterceptors, UploadedFile, BadRequestException, UseGuards, Param, Req, Res, ForbiddenException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Upload')
@UseGuards(AuthGuard('jwt'))
@Controller('upload')
export class UploadController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  @ApiOperation({ summary: 'Tải lên một file tĩnh' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        return cb(null, `${randomName}${extname(file.originalname)}`);
      }
    }),
    limits: {
      fileSize: 10 * 1024 * 1024 // Limit 10MB
    }
  }))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Vui lòng cung cấp một file');
    }
    
    // Trả về /api/upload/files/:filename thay vì /api/uploads/:filename
    const fileUrl = `${process.env.NEXT_PUBLIC_API_URL || ''}/upload/files/${file.filename}`;
    
    return {
      message: 'Upload thành công',
      url: fileUrl,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype
    };
  }

  @Get('files/:filename')
  @ApiOperation({ summary: 'Tải và Xem file bảo mật' })
  async getFile(@Param('filename') filename: string, @Req() req: any, @Res() res: Response) {
    const user = req.user;
    
    // 1. Kiểm tra quyền ưu tiên: Lập trình viên hoặc người thuộc Phòng Đăng Ký
    const DEVELOPER_USERNAMES = (process.env.DEVELOPER_USERNAMES || 'lehoangcuong').split(',').map(s => s.trim().toLowerCase());
    const isDeveloper = DEVELOPER_USERNAMES.includes(user.username?.toLowerCase() || '');
    const isDangKy = user.department === (process.env.DEPT_REGISTRATION || 'Đăng ký');
    
    if (isDeveloper || isDangKy) {
      return res.sendFile(join(process.cwd(), 'uploads', filename));
    }

    // 2. Tìm tài liệu trong DB
    const taiLieu = await this.prisma.tai_lieu_ho_so.findFirst({
      where: { duong_dan_url: { contains: filename } }
    });

    // 3. Kiểm tra xem người này có yêu cầu xin quyền nào được duyệt còn hạn không

    const orConditions: any[] = [{ file_name: filename }];
    if (taiLieu) {
      orConditions.push({ tai_lieu_id: taiLieu.id });
    }

    const request = await this.prisma.yeu_cau_truy_cap_file.findFirst({
      where: {
        nguoi_yeu_cau_id: user.userId,
        trang_thai: 'APPROVED',
        ngay_het_han: { gt: new Date() },
        OR: orConditions
      }
    });

    if (!request) {
      throw new ForbiddenException('Bạn chưa được cấp quyền xem tài liệu này hoặc quyền đã hết hạn');
    }

    // Nếu hợp lệ, trả file về
    return res.sendFile(join(process.cwd(), 'uploads', filename));
  }
}
