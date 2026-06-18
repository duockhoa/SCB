"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaiLieuDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class TaiLieuDto {
    ten_tai_lieu;
    duong_dan_url;
    ghi_chu;
}
exports.TaiLieuDto = TaiLieuDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Tên tài liệu' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], TaiLieuDto.prototype, "ten_tai_lieu", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Đường dẫn URL của file' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], TaiLieuDto.prototype, "duong_dan_url", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Ghi chú thêm', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TaiLieuDto.prototype, "ghi_chu", void 0);
//# sourceMappingURL=tai-lieu.dto.js.map