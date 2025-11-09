import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getErrorMessage } from '../utils/error.utils';
import neo4j, { Driver, Session } from 'neo4j-driver';

/**
 * Neo4j 数据库服务
 */
@Injectable()
export class Neo4jService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(Neo4jService.name);
  private driver: Driver;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const uri = this.configService.get<string>('NEO4J_URI', 'bolt://localhost:7687');
    const username = this.configService.get<string>('NEO4J_USERNAME', 'neo4j');
    const password = this.configService.get<string>('NEO4J_PASSWORD', 'password');

    try {
      this.driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
      await this.driver.verifyConnectivity();
      this.logger.log('✅ Neo4j connected successfully');
    } catch (error) {
      this.logger.error('❌ Neo4j connection failed:', getErrorMessage(error));
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.driver) {
      await this.driver.close();
      this.logger.log('Neo4j connection closed');
    }
  }

  getSession(): Session {
    return this.driver.session();
  }

  /**
   * 执行 Cypher 查询
   */
  async run(cypher: string, parameters?: any): Promise<any> {
    const session = this.getSession();
    try {
      const result = await session.run(cypher, parameters);
      return result.records.map((record) => record.toObject());
    } finally {
      await session.close();
    }
  }

  /**
   * 创建节点
   */
  async createNode(label: string, properties: any): Promise<any> {
    const cypher = `
      CREATE (n:${label} $properties)
      RETURN n
    `;
    const result = await this.run(cypher, { properties });
    return result[0]?.n;
  }

  /**
   * 创建关系
   */
  async createRelationship(
    fromLabel: string,
    fromId: string,
    toLabel: string,
    toId: string,
    relationshipType: string,
    properties?: any,
  ): Promise<any> {
    const cypher = `
      MATCH (from:${fromLabel} {id: $fromId})
      MATCH (to:${toLabel} {id: $toId})
      CREATE (from)-[r:${relationshipType} $properties]->(to)
      RETURN r
    `;
    const result = await this.run(cypher, { fromId, toId, properties: properties || {} });
    return result[0]?.r;
  }

  /**
   * 查找节点
   */
  async findNode(label: string, properties: any): Promise<any> {
    const cypher = `
      MATCH (n:${label} $properties)
      RETURN n
      LIMIT 1
    `;
    const result = await this.run(cypher, { properties });
    return result[0]?.n;
  }

  /**
   * 获取节点的所有关系
   */
  async getNodeRelationships(label: string, id: string): Promise<any[]> {
    const cypher = `
      MATCH (n:${label} {id: $id})-[r]-(m)
      RETURN type(r) as type, m, r
    `;
    return this.run(cypher, { id });
  }

  /**
   * 删除节点
   */
  async deleteNode(label: string, id: string): Promise<void> {
    const cypher = `
      MATCH (n:${label} {id: $id})
      DETACH DELETE n
    `;
    await this.run(cypher, { id });
  }
}
