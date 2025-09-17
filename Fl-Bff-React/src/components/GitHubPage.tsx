import React, { useState } from 'react';
import axios from 'axios';
import './GitHubPage.css';

interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  name: string;
  company: string;
  blog: string;
  location: string;
  email: string;
  bio: string;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

const GitHubPage: React.FC = () => {
  const [token, setToken] = useState('');
  const [userInfo, setUserInfo] = useState<GitHubUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_BASE_URL = '/api';

  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setToken(e.target.value);
    setError('');
  };

  const fetchGitHubInfo = async () => {
    if (!token.trim()) {
      setError('请输入GitHub Token');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // 通过后端代理获取GitHub用户信息
      const response = await axios.get(`${API_BASE_URL}/github/user`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setUserInfo(response.data.data);
    } catch (error: any) {
      console.error('获取GitHub信息失败:', error);
      if (error.response?.status === 401) {
        setError('Token无效或已过期');
      } else if (error.response?.status === 403) {
        setError('API调用次数超限');
      } else {
        setError('获取用户信息失败，请检查Token是否正确');
      }
      setUserInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchGitHubInfo();
  };

  const clearData = () => {
    setUserInfo(null);
    setToken('');
    setError('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="github-page">
      <h1>GitHub 用户信息</h1>

      <div className="token-form">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="token">GitHub Personal Access Token:</label>
            <input
              type="password"
              id="token"
              value={token}
              onChange={handleTokenChange}
              placeholder="请输入您的GitHub Token"
              className={error ? 'error' : ''}
            />
            <small className="token-help">
              需要GitHub Personal Access Token来获取用户信息。
              <a
                href="https://github.com/settings/tokens"
                target="_blank"
                rel="noopener noreferrer"
              >
                点击这里生成Token
              </a>
            </small>
          </div>

          <div className="form-actions">
            <button type="submit" disabled={loading}>
              {loading ? '获取中...' : '获取用户信息'}
            </button>
            {userInfo && (
              <button type="button" onClick={clearData} disabled={loading}>
                清除数据
              </button>
            )}
          </div>
        </form>

        {error && <div className="error-message">{error}</div>}
      </div>

      {userInfo && (
        <div className="user-info">
          <div className="user-header">
            <img
              src={userInfo.avatar_url}
              alt={`${userInfo.login}'s avatar`}
              className="avatar"
            />
            <div className="user-basic">
              <h2>{userInfo.name || userInfo.login}</h2>
              <p className="username">@{userInfo.login}</p>
              {userInfo.bio && <p className="bio">{userInfo.bio}</p>}
            </div>
          </div>

          <div className="user-details">
            <div className="detail-grid">
              <div className="detail-item">
                <strong>用户ID:</strong>
                <span>{userInfo.id}</span>
              </div>

              {userInfo.company && (
                <div className="detail-item">
                  <strong>公司:</strong>
                  <span>{userInfo.company}</span>
                </div>
              )}

              {userInfo.location && (
                <div className="detail-item">
                  <strong>位置:</strong>
                  <span>{userInfo.location}</span>
                </div>
              )}

              {userInfo.email && (
                <div className="detail-item">
                  <strong>邮箱:</strong>
                  <span>{userInfo.email}</span>
                </div>
              )}

              {userInfo.blog && (
                <div className="detail-item">
                  <strong>博客:</strong>
                  <a href={userInfo.blog} target="_blank" rel="noopener noreferrer">
                    {userInfo.blog}
                  </a>
                </div>
              )}

              <div className="detail-item">
                <strong>公开仓库:</strong>
                <span>{userInfo.public_repos}</span>
              </div>

              <div className="detail-item">
                <strong>公开Gists:</strong>
                <span>{userInfo.public_gists}</span>
              </div>

              <div className="detail-item">
                <strong>关注者:</strong>
                <span>{userInfo.followers}</span>
              </div>

              <div className="detail-item">
                <strong>关注中:</strong>
                <span>{userInfo.following}</span>
              </div>

              <div className="detail-item">
                <strong>注册时间:</strong>
                <span>{formatDate(userInfo.created_at)}</span>
              </div>

              <div className="detail-item">
                <strong>最后更新:</strong>
                <span>{formatDate(userInfo.updated_at)}</span>
              </div>
            </div>
          </div>

          <div className="user-stats">
            <div className="stat-item">
              <div className="stat-number">{userInfo.public_repos}</div>
              <div className="stat-label">仓库</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{userInfo.followers}</div>
              <div className="stat-label">关注者</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{userInfo.following}</div>
              <div className="stat-label">关注中</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{userInfo.public_gists}</div>
              <div className="stat-label">Gists</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GitHubPage;