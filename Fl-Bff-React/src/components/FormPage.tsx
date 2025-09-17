import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './FormPage.css';

interface FormData {
  id?: number;
  name: string;
  email: string;
}

const FormPage: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({ name: '', email: '' });
  const [dataList, setDataList] = useState<FormData[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = '/api';

  // 获取所有数据
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/form`);
      setDataList(response.data.data);
    } catch (error) {
      console.error('获取数据失败:', error);
      alert('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 提交表单（新增或更新）
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      alert('请填写所有字段');
      return;
    }

    try {
      setLoading(true);
      if (editingId) {
        // 更新
        await axios.put(`${API_BASE_URL}/form/${editingId}`, formData);
        alert('更新成功');
      } else {
        // 新增
        await axios.post(`${API_BASE_URL}/form`, formData);
        alert('添加成功');
      }

      setFormData({ name: '', email: '' });
      setEditingId(null);
      fetchData();
    } catch (error) {
      console.error('操作失败:', error);
      alert('操作失败');
    } finally {
      setLoading(false);
    }
  };

  // 编辑数据
  const handleEdit = (item: FormData) => {
    setFormData({ name: item.name, email: item.email });
    setEditingId(item.id!);
  };

  // 删除数据
  const handleDelete = async (id: number) => {
    if (!window.confirm('确定要删除这条记录吗？')) {
      return;
    }

    try {
      setLoading(true);
      await axios.delete(`${API_BASE_URL}/form/${id}`);
      alert('删除成功');
      fetchData();
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败');
    } finally {
      setLoading(false);
    }
  };

  // 取消编辑
  const handleCancel = () => {
    setFormData({ name: '', email: '' });
    setEditingId(null);
  };

  return (
    <div className="form-page">
      <h1>表单管理</h1>

      <form onSubmit={handleSubmit} className="form-container">
        <div className="form-group">
          <label htmlFor="name">姓名:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="请输入姓名"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">邮箱:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="请输入邮箱"
            required
          />
        </div>

        <div className="form-actions">
          <button type="submit" disabled={loading}>
            {loading ? '处理中...' : editingId ? '更新' : '添加'}
          </button>
          {editingId && (
            <button type="button" onClick={handleCancel} disabled={loading}>
              取消
            </button>
          )}
        </div>
      </form>

      <div className="data-list">
        <h2>数据列表</h2>
        {loading && <p>加载中...</p>}
        {dataList.length === 0 && !loading ? (
          <p>暂无数据</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>姓名</th>
                <th>邮箱</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {dataList?.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.name}</td>
                  <td>{item.email}</td>
                  <td>
                    <button
                      onClick={() => handleEdit(item)}
                      disabled={loading}
                      className="edit-btn"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(item.id!)}
                      disabled={loading}
                      className="delete-btn"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default FormPage;