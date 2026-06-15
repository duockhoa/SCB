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
exports.DanhMucController = void 0;
const common_1 = require("@nestjs/common");
const danh_muc_service_1 = require("./danh-muc.service");
const swagger_1 = require("@nestjs/swagger");
let DanhMucController = class DanhMucController {
    danhMucService;
    constructor(danhMucService) {
        this.danhMucService = danhMucService;
    }
    getLoaiHoSo() {
        return this.danhMucService.getLoaiHoSo();
    }
    getTinhTrang() {
        return this.danhMucService.getTinhTrang();
    }
    getLoaiTaiLieu() {
        return this.danhMucService.getLoaiTaiLieu();
    }
    getLoaiThayDoi() {
        return this.danhMucService.getLoaiThayDoi();
    }
};
exports.DanhMucController = DanhMucController;
__decorate([
    (0, common_1.Get)('loai-ho-so'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy danh mục loại hồ sơ' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DanhMucController.prototype, "getLoaiHoSo", null);
__decorate([
    (0, common_1.Get)('tinh-trang'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy danh mục tình trạng hồ sơ' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DanhMucController.prototype, "getTinhTrang", null);
__decorate([
    (0, common_1.Get)('loai-tai-lieu'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy danh mục loại tài liệu' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DanhMucController.prototype, "getLoaiTaiLieu", null);
__decorate([
    (0, common_1.Get)('loai-thay-doi'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy danh mục loại thay đổi' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DanhMucController.prototype, "getLoaiThayDoi", null);
exports.DanhMucController = DanhMucController = __decorate([
    (0, swagger_1.ApiTags)('Danh Mục'),
    (0, common_1.Controller)('danh-muc'),
    __metadata("design:paramtypes", [danh_muc_service_1.DanhMucService])
], DanhMucController);
//# sourceMappingURL=danh-muc.controller.js.map