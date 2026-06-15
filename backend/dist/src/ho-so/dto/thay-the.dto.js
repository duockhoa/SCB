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
exports.ThayTheDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class ThayTheDto {
    ma_ho_so_moi;
    so_chinh_moi;
    ngay_cong_bo;
    ngay_het_han;
    ngay_nhac_han;
}
exports.ThayTheDto = ThayTheDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Mã hồ sơ hệ thống mới' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ThayTheDto.prototype, "ma_ho_so_moi", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Số đăng ký / Số công bố mới' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ThayTheDto.prototype, "so_chinh_moi", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Ngày bắt đầu có hiệu lực mới' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", Date)
], ThayTheDto.prototype, "ngay_cong_bo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Ngày hết hiệu lực mới' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", Date)
], ThayTheDto.prototype, "ngay_het_han", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Ngày cần nhắc nhở mới' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", Date)
], ThayTheDto.prototype, "ngay_nhac_han", void 0);
//# sourceMappingURL=thay-the.dto.js.map