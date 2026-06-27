import { Test, TestingModule } from '@nestjs/testing';
import { FileAccessController } from './file-access.controller';

describe('FileAccessController', () => {
  let controller: FileAccessController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FileAccessController],
    }).compile();

    controller = module.get<FileAccessController>(FileAccessController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
