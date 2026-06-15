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
exports.CongTyController = void 0;
const common_1 = require("@nestjs/common");
const cong_ty_service_1 = require("./cong-ty.service");
const create_cong_ty_dto_1 = require("./dto/create-cong-ty.dto");
const update_cong_ty_dto_1 = require("./dto/update-cong-ty.dto");
const swagger_1 = require("@nestjs/swagger");
let CongTyController = class CongTyController {
    congTyService;
    constructor(congTyService) {
        this.congTyService = congTyService;
    }
    create(createCongTyDto) {
        return this.congTyService.create(createCongTyDto);
    }
    findAll() {
        return this.congTyService.findAll();
    }
    findOne(id) {
        return this.congTyService.findOne(id);
    }
    update(id, updateCongTyDto) {
        return this.congTyService.update(id, updateCongTyDto);
    }
    remove(id) {
        return this.congTyService.remove(id);
    }
};
exports.CongTyController = CongTyController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Tạo mới công ty' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_cong_ty_dto_1.CreateCongTyDto]),
    __metadata("design:returntype", void 0)
], CongTyController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy danh sách công ty' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CongTyController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy thông tin chi tiết công ty' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], CongTyController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Cập nhật công ty' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_cong_ty_dto_1.UpdateCongTyDto]),
    __metadata("design:returntype", void 0)
], CongTyController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Xóa công ty' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], CongTyController.prototype, "remove", null);
exports.CongTyController = CongTyController = __decorate([
    (0, swagger_1.ApiTags)('Công Ty'),
    (0, common_1.Controller)('cong-ty'),
    __metadata("design:paramtypes", [cong_ty_service_1.CongTyService])
], CongTyController);
//# sourceMappingURL=cong-ty.controller.js.map