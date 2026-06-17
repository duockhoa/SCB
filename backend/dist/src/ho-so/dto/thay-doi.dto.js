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
exports.ThayDoiDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class ThayDoiDto {
    loai_thay_doi_id;
    lan_thu;
    noi_dung_thay_doi;
    ma_so_tham_chieu;
    ngay_thay_doi;
    ngay_phe_duyet;
    tinh_trang;
    cong_van_url;
    ghi_chu;
}
exports.ThayDoiDto = ThayDoiDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'ID Loại thay đổi' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ThayDoiDto.prototype, "loai_thay_doi_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Lần thay đổi thứ mấy' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ThayDoiDto.prototype, "lan_thu", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Nội dung thay đổi' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ThayDoiDto.prototype, "noi_dung_thay_doi", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Mã số công văn/quyết định' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ThayDoiDto.prototype, "ma_so_tham_chieu", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Ngày thay đổi/phê duyệt' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", Date)
], ThayDoiDto.prototype, "ngay_thay_doi", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Ngày công văn/quyết định' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", Date)
], ThayDoiDto.prototype, "ngay_phe_duyet", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Tình trạng phê duyệt' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ThayDoiDto.prototype, "tinh_trang", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Link tải file công văn' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ThayDoiDto.prototype, "cong_van_url", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Ghi chú thêm' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ThayDoiDto.prototype, "ghi_chu", void 0);
//# sourceMappingURL=thay-doi.dto.js.map