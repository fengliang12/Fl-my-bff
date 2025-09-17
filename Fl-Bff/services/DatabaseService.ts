import 'reflect-metadata';
import { AppDataSource } from '../ormconfig';
import { User } from '../entities/User';
import { Repository } from 'typeorm';

export interface FormData {
  id?: number;
  name: string;
  email: string;
  created_at?: string;
  updated_at?: string;
}

class DatabaseService {
  private static instance: DatabaseService;
  private userRepository: Repository<User>;
  private isInitialized = false;

  private constructor() {
    // 私有构造函数，防止直接实例化
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private async initDatabase() {
    try {
      if (!this.isInitialized) {
        await AppDataSource.initialize();
        this.userRepository = AppDataSource.getRepository(User);
        this.isInitialized = true;
        console.log('PostgreSQL数据库连接成功');
      }
    } catch (error) {
      console.error('数据库连接失败:', error);
      throw error;
    }
  }

  private async ensureInitialized() {
    if (!this.isInitialized) {
      await this.initDatabase();
    }
  }

  public async getAllFormData(): Promise<FormData[]> {
    try {
      await this.ensureInitialized();
      const users = await this.userRepository.find({
        order: { createdAt: 'DESC' }
      });
      return users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.createdAt.toISOString(),
        updated_at: user.updatedAt.toISOString()
      }));
    } catch (error) {
      console.error('获取表单数据失败:', error);
      throw error;
    }
  }

  public async getFormDataById(id: number): Promise<FormData | null> {
    try {
      await this.ensureInitialized();
      const user = await this.userRepository.findOne({ where: { id } });
      if (!user) return null;
      
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.createdAt.toISOString(),
        updated_at: user.updatedAt.toISOString()
      };
    } catch (error) {
      console.error('获取表单数据失败:', error);
      throw error;
    }
  }

  public async createFormData(
    data: Omit<FormData, "id" | "created_at" | "updated_at">
  ): Promise<FormData> {
    try {
      await this.ensureInitialized();
      const user = new User();
      user.name = data.name;
      user.email = data.email;
      
      const savedUser = await this.userRepository.save(user);
      
      return {
        id: savedUser.id,
        name: savedUser.name,
        email: savedUser.email,
        created_at: savedUser.createdAt.toISOString(),
        updated_at: savedUser.updatedAt.toISOString()
      };
    } catch (error) {
      console.error('创建表单数据失败:', error);
      throw error;
    }
  }

  public async updateFormData(
    id: number,
    data: Omit<FormData, "id" | "created_at" | "updated_at">
  ): Promise<FormData | null> {
    try {
      await this.ensureInitialized();
      const user = await this.userRepository.findOne({ where: { id } });
      if (!user) return null;
      
      user.name = data.name;
      user.email = data.email;
      
      const updatedUser = await this.userRepository.save(user);
      
      return {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        created_at: updatedUser.createdAt.toISOString(),
        updated_at: updatedUser.updatedAt.toISOString()
      };
    } catch (error) {
      console.error('更新表单数据失败:', error);
      throw error;
    }
  }

  public async deleteFormData(id: number): Promise<boolean> {
    try {
      await this.ensureInitialized();
      const result = await this.userRepository.delete(id);
      return result.affected !== undefined && result.affected > 0;
    } catch (error) {
      console.error('删除表单数据失败:', error);
      throw error;
    }
  }

  public async close(): Promise<void> {
    try {
      if (this.isInitialized && AppDataSource.isInitialized) {
        await AppDataSource.destroy();
        this.isInitialized = false;
        console.log('数据库连接已关闭');
      }
    } catch (error) {
      console.error('关闭数据库连接失败:', error);
      throw error;
    }
  }
}

const databaseServiceInstance = DatabaseService.getInstance();

module.exports = databaseServiceInstance;
export default databaseServiceInstance;
