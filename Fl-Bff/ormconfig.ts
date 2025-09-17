import { DataSource } from "typeorm";
import * as dotenv from "dotenv";
import { User } from "./entities/User";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: true, // 开发环境可以使用，生产环境建议关闭  这是表自动创建的核心 ，开发环境下会根据实体定义自动创建/更新表结构
  logging: true,
  entities: [User],
  migrations: ["src/migrations/**/*.ts"],
  subscribers: ["src/subscribers/**/*.ts"],
});
