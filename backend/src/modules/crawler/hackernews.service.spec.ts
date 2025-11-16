import { Test, TestingModule } from '@nestjs/testing';
import { HackernewsService } from './hackernews.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { MongoDBService } from '../../common/mongodb/mongodb.service';
import { DeduplicationService } from './deduplication.service';
import { AIEnrichmentService } from '../resources/ai-enrichment.service';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('HackernewsService', () => {
  let service: HackernewsService;
  let prismaService: any; // Use any for Prisma mocks due to generated types
  let mongoService: any;

  // Mock数据
  const mockStoryIds = [123, 456, 789];
  const mockStoryData = {
    id: 123,
    type: 'story',
    by: 'testuser',
    time: 1234567890,
    title: 'Test Story Title',
    url: 'https://example.com/article',
    score: 100,
    descendants: 50,
    kids: [111, 222],
  };

  beforeEach(async () => {
    // 创建模拟服务
    const mockPrismaService = {
      resource: {
        create: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    const mockMongoService = {
      findRawDataByExternalId: jest.fn(),
      insertRawData: jest.fn(),
      linkResourceToRawData: jest.fn(),
    };

    const mockDedupService = {
      generateUrlHash: jest.fn(),
      areTitlesSimilar: jest.fn(),
    };

    const mockAiService = {
      enrichResourceWithAI: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HackernewsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: MongoDBService,
          useValue: mockMongoService,
        },
        {
          provide: DeduplicationService,
          useValue: mockDedupService,
        },
        {
          provide: AIEnrichmentService,
          useValue: mockAiService,
        },
      ],
    }).compile();

    service = module.get<HackernewsService>(HackernewsService);
    prismaService = module.get(PrismaService);
    mongoService = module.get(MongoDBService);
    // dedupService and aiService are injected but not directly tested
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('fetchTopStories', () => {
    it('应该成功获取热门故事', async () => {
      // 模拟API响应
      mockedAxios.get.mockResolvedValueOnce({
        data: mockStoryIds,
      });

      // 模拟每个故事的详情
      mockedAxios.get.mockResolvedValue({
        data: mockStoryData,
      });

      // 模拟去重检查（不存在）
      mongoService.findRawDataByExternalId.mockResolvedValue(null);

      // 模拟MongoDB插入
      mongoService.insertRawData.mockResolvedValue('mock-mongo-id-123');

      // 模拟Prisma创建资源
      prismaService.resource.create.mockResolvedValue({
        id: 'mock-resource-id',
        title: mockStoryData.title,
        type: 'NEWS',
      } as any);

      const result = await service.fetchTopStories(3);

      expect(result).toBe(3); // 应该处理3个故事
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('topstories.json')
      );
      expect(mongoService.insertRawData).toHaveBeenCalledTimes(3);
      expect(prismaService.resource.create).toHaveBeenCalledTimes(3);
    });

    it('应该处理API错误', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('API Error'));

      await expect(service.fetchTopStories(10)).rejects.toThrow('API Error');
    });

    it('应该跳过已存在的故事（去重）', async () => {
      // 模拟API返回1个故事
      mockedAxios.get.mockResolvedValueOnce({
        data: [123],
      });

      mockedAxios.get.mockResolvedValueOnce({
        data: mockStoryData,
      });

      // 模拟去重检查（已存在）
      mongoService.findRawDataByExternalId.mockResolvedValue({
        _id: 'existing-id',
        source: 'hackernews',
        data: {},
      } as any);

      const result = await service.fetchTopStories(1);

      // 应该成功，但不会创建新资源
      expect(result).toBe(0);
      expect(mongoService.insertRawData).not.toHaveBeenCalled();
      expect(prismaService.resource.create).not.toHaveBeenCalled();
    });

    it('应该限制获取数量', async () => {
      const manyIds = Array.from({ length: 100 }, (_, i) => i + 1);
      mockedAxios.get.mockResolvedValueOnce({
        data: manyIds,
      });

      mockedAxios.get.mockResolvedValue({
        data: mockStoryData,
      });

      mongoService.findRawDataByExternalId.mockResolvedValue(null);
      mongoService.insertRawData.mockResolvedValue('mock-id');
      prismaService.resource.create.mockResolvedValue({ id: 'id' } as any);

      await service.fetchTopStories(5);

      // 应该只处理5个
      expect(mongoService.insertRawData).toHaveBeenCalledTimes(5);
    });
  });

  describe('fetchNewStories', () => {
    it('应该成功获取最新故事', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: mockStoryIds,
      });

      mockedAxios.get.mockResolvedValue({
        data: mockStoryData,
      });

      mongoService.findRawDataByExternalId.mockResolvedValue(null);
      mongoService.insertRawData.mockResolvedValue('mock-mongo-id');
      prismaService.resource.create.mockResolvedValue({
        id: 'mock-resource-id',
      } as any);

      const result = await service.fetchNewStories(3);

      expect(result).toBe(3);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('newstories.json')
      );
    });
  });

  describe('fetchBestStories', () => {
    it('应该成功获取最佳故事', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: mockStoryIds,
      });

      mockedAxios.get.mockResolvedValue({
        data: mockStoryData,
      });

      mongoService.findRawDataByExternalId.mockResolvedValue(null);
      mongoService.insertRawData.mockResolvedValue('mock-mongo-id');
      prismaService.resource.create.mockResolvedValue({
        id: 'mock-resource-id',
      } as any);

      const result = await service.fetchBestStories(3);

      expect(result).toBe(3);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('beststories.json')
      );
    });
  });

  describe('错误处理', () => {
    it('应该处理单个故事获取失败但继续处理其他故事', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: [123, 456, 789],
      });

      // 第一个成功，第二个失败，第三个成功
      mockedAxios.get
        .mockResolvedValueOnce({ data: mockStoryData })
        .mockRejectedValueOnce(new Error('故事456获取失败'))
        .mockResolvedValueOnce({ data: { ...mockStoryData, id: 789 } });

      mongoService.findRawDataByExternalId.mockResolvedValue(null);
      mongoService.insertRawData.mockResolvedValue('mock-id');
      prismaService.resource.create.mockResolvedValue({ id: 'id' } as any);

      const result = await service.fetchTopStories(3);

      // 应该成功处理2个（跳过失败的那个）
      expect(result).toBe(2);
    });

    it('应该处理MongoDB插入失败', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: [123],
      });

      mockedAxios.get.mockResolvedValueOnce({
        data: mockStoryData,
      });

      mongoService.findRawDataByExternalId.mockResolvedValue(null);
      mongoService.insertRawData.mockRejectedValue(new Error('MongoDB错误'));

      const result = await service.fetchTopStories(1);

      expect(result).toBe(0); // 失败，计数为0
      expect(prismaService.resource.create).not.toHaveBeenCalled();
    });
  });

  describe('数据完整性', () => {
    it('应该存储完整的原始数据到MongoDB', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: [123],
      });

      mockedAxios.get.mockResolvedValueOnce({
        data: mockStoryData,
      });

      mongoService.findRawDataByExternalId.mockResolvedValue(null);
      mongoService.insertRawData.mockResolvedValue('mongo-id');
      prismaService.resource.create.mockResolvedValue({ id: 'res-id' } as any);

      await service.fetchTopStories(1);

      // 验证MongoDB存储了完整数据
      expect(mongoService.insertRawData).toHaveBeenCalledWith(
        'hackernews',
        expect.objectContaining({
          externalId: expect.any(String),
          _raw: mockStoryData, // 应该包含完整原始数据
        }),
        expect.any(String), // sourceUrl
        expect.any(String), // collectionName
      );
    });

    it('应该建立MongoDB和PostgreSQL的双向引用', async () => {
      const mongoId = 'mongo-raw-data-id-123';
      const resourceId = 'postgres-resource-id-456';

      mockedAxios.get.mockResolvedValueOnce({
        data: [123],
      });

      mockedAxios.get.mockResolvedValueOnce({
        data: mockStoryData,
      });

      mongoService.findRawDataByExternalId.mockResolvedValue(null);
      mongoService.insertRawData.mockResolvedValue(mongoId);
      prismaService.resource.create.mockResolvedValue({
        id: resourceId,
      } as any);

      await service.fetchTopStories(1);

      // 验证Prisma创建资源时包含rawDataId
      expect(prismaService.resource.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          rawDataId: mongoId,
        }),
      });

      // 验证MongoDB更新引用
      expect(mongoService.linkResourceToRawData).toHaveBeenCalledWith(
        mongoId,
        resourceId
      );
    });
  });
});
