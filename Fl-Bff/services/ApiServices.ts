import { IApi } from "@interfaces/IApi";
import { IData } from "@interfaces/IData";

class ApiServices implements IApi {
  getInfo(): Promise<IData> {
    return new Promise((resolve, reject) => {
      resolve({
        item: "我是后台数据",
        result: [11],
      });
    });
  }
}

export default ApiServices;
