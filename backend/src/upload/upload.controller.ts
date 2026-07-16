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
  @ApiOperation({ summary: 'Tải và Xem file' })
  async getFile(@Param('filename') filename: string, @Req() req: any, @Res() res: Response) {
    // Cho phép toàn bộ người dùng đã xác thực (qua jwt) tải và xem file trực tiếp
    return res.sendFile(join(process.cwd(), 'uploads', filename));
  }
}

@ApiTags('Upload')
@UseGuards(AuthGuard('jwt'))
@Controller('uploads')
export class LegacyUploadController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':filename')
  @ApiOperation({ summary: 'Hỗ trợ xem file từ link cũ (/api/uploads/...)' })
  async getFile(@Param('filename') filename: string, @Req() req: any, @Res() res: Response) {
    // Cho phép toàn bộ người dùng đã xác thực (qua jwt) tải và xem file trực tiếp
    return res.sendFile(join(process.cwd(), 'uploads', filename));
  }
}
