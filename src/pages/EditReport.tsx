import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { reportApi, unwrapApiResponse } from '../services/api';
import type { Report } from '../types';
import { Loading } from '../components';

interface ReportFormData {
  title: string;
  playerName: string;
  playerAge: number;
  position: string;
  content: string;
  rating: number;
  price: number;
  coverImage?: string;
}

const EditReport: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { register, handleSubmit, setValue } = useForm<ReportFormData>();
  const navigate = useNavigate();

  useEffect(() => {
    if (isEdit && id) {
      loadReport(id);
    } else {
      // 非编辑模式：检查是否有从历史订单复制过来的草稿
      const draftRaw = localStorage.getItem('report_new_draft');
      if (draftRaw) {
        try {
          const draft = JSON.parse(draftRaw);
          (Object.keys(draft) as Array<keyof ReportFormData>).forEach((key) => {
            setValue(key, draft[key]);
          });
          localStorage.removeItem('report_new_draft');
        } catch {
          console.error('解析报告草稿失败');
        }
      }
      setLoading(false);
    }
  }, [id, isEdit, setValue]);

  const loadReport = async (reportId: string) => {
    try {
      const response = await reportApi.getById(reportId);
      const payload = unwrapApiResponse(response);
      if (payload.success && payload.data) {
        const report = payload.data.data || payload.data;
        (Object.keys(report) as Array<keyof Report>).forEach(key => {
          setValue(key as any, report[key]);
        });
      }
    } catch (error) {
      console.error('加载报告失败', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ReportFormData) => {
    try {
      setError('');
      setSaving(true);
      
      if (isEdit && id) {
        await reportApi.update(id, data);
      } else {
        await reportApi.create(data);
      }
      
      navigate('/analyst/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || '保存失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Loading />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="card">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">
          {isEdit ? '编辑报告' : '新建报告'}
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">报告标题</label>
              <input
                {...register('title', { required: true })}
                className="input-field"
                placeholder="例如：张三 - 2025年度评估报告"
              />
            </div>
            <div>
              <label className="form-label">球员姓名</label>
              <input
                {...register('playerName', { required: true })}
                className="input-field"
                placeholder="输入球员姓名"
              />
            </div>
            <div>
              <label className="form-label">球员年龄</label>
              <input
                type="number"
                {...register('playerAge', { required: true, valueAsNumber: true })}
                className="input-field"
                placeholder="年龄"
              />
            </div>
            <div>
              <label className="form-label">位置</label>
              <input
                {...register('position', { required: true })}
                className="input-field"
                placeholder="例如：前锋、中场、后卫"
              />
            </div>
            <div>
              <label className="form-label">评分 (0-10)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                {...register('rating', { required: true, valueAsNumber: true })}
                className="input-field"
                placeholder="综合评分"
              />
            </div>
            <div>
              <label className="form-label">价格 (元)</label>
              <input
                type="number"
                step="1"
                min="0"
                {...register('price', { required: true, valueAsNumber: true })}
                className="input-field"
                placeholder="报告价格"
              />
            </div>
          </div>

          <div>
            <label className="form-label">封面图片 URL</label>
            <input
              {...register('coverImage')}
              className="input-field"
              placeholder="可选，输入封面图片地址"
            />
          </div>

          <div>
            <label className="form-label">报告内容</label>
            <textarea
              {...register('content', { required: true })}
              rows={20}
              className="input-field font-mono text-base leading-relaxed"
              placeholder="输入报告内容，支持换行..."
            />
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-secondary"
              disabled={saving}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary"
            >
              {saving ? '保存中...' : '保存报告'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditReport;
