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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HoSoController = void 0;
const common_1 = require("@nestjs/common");
const ho_so_service_1 = require("./ho-so.service");
const create_ho_so_dto_1 = require("./dto/create-ho-so.dto");
const update_ho_so_dto_1 = require("./dto/update-ho-so.dto");
const cap_so_dto_1 = require("./dto/cap-so.dto");
const gia_han_dto_1 = require("./dto/gia-han.dto");
const thay_the_dto_1 = require("./dto/thay-the.dto");
const swagger_1 = require("@nestjs/swagger");
let HoSoController = class HoSoController {
    hoSoService;
    constructor(hoSoService) {
        this.hoSoService = hoSoService;
    }
    create(createHoSoDto) {
        return this.hoSoService.create(createHoSoDto);
    }
    findAll(query) {
        return this.hoSoService.findAll(query);
    }
    findOne(id) {
        return this.hoSoService.findOne(id);
    }
    update(id, updateHoSoDto) {
        return this.hoSoService.update(id, updateHoSoDto);
    }
    capSo(id, capSoDto) {
        return this.hoSoService.capSo(id, capSoDto);
    }
    giaHan(id, giaHanDto) {
        return this.hoSoService.giaHan(id, giaHanDto);
    }
    thayThe(id, thayTheDto) {
        return this.hoSoService.thayThe(id, thayTheDto);
    }
    remove(id) {
        return this.hoSoService.remove(id);
    }
};
exports.HoSoController = HoSoController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Tạo mới hồ sơ' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_ho_so_dto_1.CreateHoSoDto]),
    __metadata("design:returntype", void 0)
], HoSoController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy danh sách hồ sơ (có filter)' }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'loai_ho_so', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'tinh_trang', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'cong_ty_id', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'ngay_het_han_from', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'ngay_het_han_to', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], HoSoController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy thông tin chi tiết hồ sơ' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], HoSoController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Cập nhật hồ sơ' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_ho_so_dto_1.UpdateHoSoDto]),
    __metadata("design:returntype", void 0)
], HoSoController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/cap-so'),
    (0, swagger_1.ApiOperation)({ summary: 'Cấp số công bố cho hồ sơ' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, cap_so_dto_1.CapSoDto]),
    __metadata("design:returntype", void 0)
], HoSoController.prototype, "capSo", null);
__decorate([
    (0, common_1.Post)(':id/gia-han'),
    (0, swagger_1.ApiOperation)({ summary: 'Gia hạn hồ sơ' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, gia_han_dto_1.GiaHanDto]),
    __metadata("design:returntype", void 0)
], HoSoController.prototype, "giaHan", null);
__decorate([
    (0, common_1.Post)(':id/thay-the'),
    (0, swagger_1.ApiOperation)({ summary: 'Thay thế hồ sơ (Đổi số công bố)' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, thay_the_dto_1.ThayTheDto]),
    __metadata("design:returntype", void 0)
], HoSoController.prototype, "thayThe", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Xóa hồ sơ' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], HoSoController.prototype, "remove", null);
exports.HoSoController = HoSoController = __decorate([
    (0, swagger_1.ApiTags)('Hồ Sơ'),
    (0, common_1.Controller)('ho-so'),
    __metadata("design:paramtypes", [ho_so_service_1.HoSoService])
], HoSoController);
//# sourceMappingURL=ho-so.controller.js.map