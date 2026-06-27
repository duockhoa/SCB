import { Test, TestingModule } from '@nestjs/testing';
import { FileAccessService } from './file-access.service';

describe('FileAccessService', () => {
  let service: FileAccessService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FileAccessService],
    }).compile();

    service = module.get<FileAccessService>(FileAccessService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
