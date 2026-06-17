export declare class UploadController {
    uploadFile(file: Express.Multer.File): {
        message: string;
        url: string;
        filename: string;
        originalName: string;
        size: number;
        mimetype: string;
    };
}
