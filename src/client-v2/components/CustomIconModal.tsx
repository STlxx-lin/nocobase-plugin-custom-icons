import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  Tabs,
  Form,
  Input,
  Select,
  Button,
  message,
  Space,
  Card,
  Typography,
  Upload,
  Divider,
  Tag,
  Alert,
  Segmented,
  Row,
  Col,
  Tooltip,
  theme,
} from 'antd';
import {
  InboxOutlined,
  PlusOutlined,
  DeleteOutlined,
  CloudUploadOutlined,
  AppstoreAddOutlined,
  SyncOutlined,
  CloudDownloadOutlined,
  PictureOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  ClearOutlined,
  FileAddOutlined,
  CodeOutlined,
  GlobalOutlined,
  BgColorsOutlined,
} from '@ant-design/icons';
import { customIconsManager, CustomIconItem } from '../services/custom-icons-manager';
import { sanitizeAndFormatSvg, parseBatchSvgString } from '../utils/svg-helper';

const { TextArea } = Input;
const { Text } = Typography;

interface CustomIconModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (icon: CustomIconItem) => void;
  apiClient?: any;
}

export const CustomIconModal: React.FC<CustomIconModalProps> = ({
  open,
  onClose,
  onSuccess,
  apiClient,
}) => {
  const { token } = theme.useToken();

  // 判断暗黑环境
  const isDark = useMemo(() => {
    const bg = token.colorBgContainer || '#ffffff';
    if (bg.startsWith('#')) {
      const hex = bg.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16) || 0;
      const g = parseInt(hex.substring(2, 4), 16) || 0;
      const b = parseInt(hex.substring(4, 6), 16) || 0;
      return (r * 299 + g * 587 + b * 114) / 1000 < 128;
    }
    return false;
  }, [token.colorBgContainer]);

  const [activeTab, setActiveTab] = useState('single');
  const [form] = Form.useForm();
  const [svgInput, setSvgInput] = useState('');
  const [categories, setCategories] = useState<string[]>(['custom']);
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [loading, setLoading] = useState(false);

  // 右侧看板背景模式：checker (棋盘底) | light (浅色底) | dark (深色底)
  const [previewBgMode, setPreviewBgMode] = useState<'checker' | 'light' | 'dark'>('checker');

  // 批量导入状态
  const [batchSourceType, setBatchSourceType] = useState<'file' | 'iconfont' | 'symbol'>('file');
  const [batchItems, setBatchItems] = useState<Array<{ name: string; title: string; svg: string }>>([]);
  const [batchCategory, setBatchCategory] = useState('custom');
  const [isNewBatchCategory, setIsNewBatchCategory] = useState(false);
  const [newBatchCategoryInput, setNewBatchCategoryInput] = useState('');

  // Iconfont 合辑快速导入状态
  const [iconfontUrlInput, setIconfontUrlInput] = useState('');
  const [fetchingIconfont, setFetchingIconfont] = useState(false);

  // 源码粘贴批量解析输入
  const [batchRawText, setBatchRawText] = useState('');

  useEffect(() => {
    if (open) {
      refreshData();
    }
  }, [open]);

  const refreshData = () => {
    setCategories(customIconsManager.getCategories());
  };

  // 单个 SVG 预览计算及规范诊断
  const previewInfo = useMemo(() => {
    if (!svgInput.trim()) {
      return { cleanSvg: '', viewBox: '', hasCurrentColor: false, pathCount: 0, isValid: false };
    }
    try {
      const cleanSvg = sanitizeAndFormatSvg(svgInput);
      if (!cleanSvg || !cleanSvg.includes('<svg')) {
        return { cleanSvg: '', viewBox: '', hasCurrentColor: false, pathCount: 0, isValid: false };
      }

      // 提取 viewBox
      const viewBoxMatch = cleanSvg.match(/viewBox=["']([^"']+)["']/i);
      const viewBox = viewBoxMatch ? viewBoxMatch[1] : '';

      // 检测是否支持主题变色
      const hasCurrentColor = cleanSvg.includes('currentColor');

      // 统计 Path 数量
      const pathMatches = cleanSvg.match(/<path[\s\S]*?>/gi);
      const pathCount = pathMatches ? pathMatches.length : 0;

      return {
        cleanSvg,
        viewBox,
        hasCurrentColor,
        pathCount,
        isValid: true,
      };
    } catch (err) {
      return { cleanSvg: '', viewBox: '', hasCurrentColor: false, pathCount: 0, isValid: false };
    }
  }, [svgInput]);

  // 提交单条图标
  const handleSingleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const category = isNewCategory ? values.newCategory?.trim() : values.category;
      if (!category) {
        message.error('请指定图标分类');
        setLoading(false);
        return;
      }

      const saved = await customIconsManager.saveIcon(
        {
          name: values.name.trim(),
          title: values.title?.trim() || values.name.trim(),
          category,
          svg: values.svg,
          source: 'manual',
        },
        apiClient,
      );

      message.success(`图标 [${saved.name}] 保存成功！`);
      form.resetFields();
      setSvgInput('');
      refreshData();
      onSuccess?.(saved);
      onClose();
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error(err?.message || '保存失败，请检查 SVG 内容与标识');
    } finally {
      setLoading(false);
    }
  };

  // 处理文件批量读取
  const handleFilesUpload = async (fileList: any[]) => {
    const items: Array<{ name: string; title: string; svg: string }> = [];

    for (const file of fileList) {
      const text = await file.text();
      const cleanSvg = sanitizeAndFormatSvg(text);
      if (cleanSvg) {
        const rawName = file.name.replace(/\.svg$/i, '').toLowerCase().replace(/[^a-z0-9-_]/g, '-');
        items.push({
          name: rawName,
          title: file.name.replace(/\.svg$/i, ''),
          svg: cleanSvg,
        });
      }
    }

    setBatchItems((prev) => [...prev, ...items]);
    message.success(`已成功解析 ${items.length} 个本地 SVG 文件`);
    return false;
  };

  // 处理粘贴批量文本解析
  const handleParseBatchText = () => {
    if (!batchRawText.trim()) {
      message.warning('请先输入或粘贴待解析的代码');
      return;
    }
    const items = parseBatchSvgString(batchRawText);
    if (items.length === 0) {
      message.warning('未检测到有效的 SVG 或 Iconfont Symbol 标签，请核对代码格式');
      return;
    }
    setBatchItems((prev) => [...prev, ...items]);
    setBatchRawText('');
    message.success(`成功识别出 ${items.length} 款矢量图标！`);
  };

  // 执行批量导入
  const handleExecuteBatchImport = async () => {
    if (batchItems.length === 0) {
      message.warning('请先上传或解析待导入的图标');
      return;
    }

    const targetCategory = isNewBatchCategory ? newBatchCategoryInput.trim() : batchCategory.trim();
    if (!targetCategory) {
      message.error('请指定归属分类');
      return;
    }

    setLoading(true);
    try {
      const itemsToImport = batchItems.map((item) => ({
        ...item,
        category: targetCategory,
        source: 'batch',
      }));

      const count = await customIconsManager.batchImportIcons(itemsToImport, apiClient);
      message.success(`成功批量导入 ${count} 个图标到分类 [${targetCategory}]！`);
      setBatchItems([]);
      refreshData();
      onClose();
    } catch (err: any) {
      message.error(err?.message || '批量导入失败');
    } finally {
      setLoading(false);
    }
  };

  // 从 Iconfont 合辑直接一键拉取并批量导入
  const handleFetchIconfontCollection = async () => {
    if (!iconfontUrlInput.trim()) {
      message.warning('请输入 Iconfont 合辑链接或合辑 ID（例如 54546）');
      return;
    }

    const targetCategory = isNewBatchCategory ? newBatchCategoryInput.trim() : batchCategory.trim();
    setFetchingIconfont(true);
    const hideMsg = message.loading('正在连接 Iconfont 平台获取矢量合辑数据...', 0);
    try {
      let res: any = null;
      try {
        res = await apiClient.request({
          url: 'customIconRepos:importIconfont',
          method: 'post',
          data: {
            input: iconfontUrlInput.trim(),
            category: targetCategory || undefined,
          },
        });
      } catch (e1) {
        res = await apiClient.request({
          url: 'custom_icon_repos:importIconfont',
          method: 'post',
          data: {
            input: iconfontUrlInput.trim(),
            category: targetCategory || undefined,
          },
        });
      }
      const result = res?.data?.data || res?.data || {};
      message.success(
        `恭喜！成功从 Iconfont 导入 [${result.title || '合辑'}]，共 ${result.total || 0} 款矢量图标！已自动分类至 [${result.category || targetCategory}]`,
      );
      await customIconsManager.loadIcons(apiClient);
      refreshData();
      setIconfontUrlInput('');
      onClose();
    } catch (err: any) {
      message.error(err?.response?.data?.message || err?.message || '导入 Iconfont 合辑失败');
    } finally {
      hideMsg();
      setFetchingIconfont(false);
    }
  };

  // 获取右侧主预览区的动态背景样式
  const getPreviewBgStyle = () => {
    if (previewBgMode === 'light') {
      return {
        backgroundColor: '#ffffff',
        border: `1px solid ${token.colorBorderSecondary}`,
      };
    }
    if (previewBgMode === 'dark') {
      return {
        backgroundColor: '#141414',
        border: '1px solid #303030',
      };
    }
    // checker (透明棋盘纹理)
    const dotColor = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)';
    const bgColor = isDark ? '#1a1a1a' : '#f5f5f5';
    return {
      backgroundColor: bgColor,
      backgroundImage: `linear-gradient(45deg, ${dotColor} 25%, transparent 25%), linear-gradient(-45deg, ${dotColor} 25%, transparent 25%), linear-gradient(45deg, transparent 75%, ${dotColor} 75%), linear-gradient(-45deg, transparent 75%, ${dotColor} 75%)`,
      backgroundSize: '16px 16px',
      backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
      border: `1px solid ${token.colorBorderSecondary}`,
    };
  };

  return (
    <Modal
      title={
        <Space size={8}>
          <AppstoreAddOutlined style={{ color: '#1677ff', fontSize: 18 }} />
          <span style={{ fontSize: 16, fontWeight: 600 }}>自定义图标库与 SVG 扩展</span>
          <Tag color="blue" style={{ marginLeft: 4 }}>矢量工作台</Tag>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={860}
      destroyOnClose
      style={{ top: 24 }}
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'single',
            label: (
              <span style={{ fontSize: 14 }}>
                <PlusOutlined /> 自定义录入 SVG
              </span>
            ),
            children: (
              <div style={{ paddingTop: 4 }}>
                <Row gutter={[20, 20]} align="stretch">
                  {/* 左侧：表单录入区 (54%) */}
                  <Col xs={24} md={13} style={{ display: 'flex', flexDirection: 'column' }}>
                    <Alert
                      type="info"
                      showIcon
                      message={
                        <span style={{ fontSize: 12 }}>
                          输入或粘贴任意 SVG 矢量代码，系统将自动清洗并规范化为响应式自适应图标。
                        </span>
                      }
                      style={{ marginBottom: 14, borderRadius: 6, padding: '8px 12px' }}
                    />

                    <Form
                      form={form}
                      layout="vertical"
                      initialValues={{ category: 'custom' }}
                      style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
                    >
                      <Row gutter={12}>
                        <Col span={12}>
                          <Form.Item
                            name="name"
                            label="图标唯一标识 (Name)"
                            rules={[
                              { required: true, message: '请输入图标标识' },
                              {
                                pattern: /^[a-zA-Z0-9_-]+$/,
                                message: '仅支持英文字母、数字、下划线及中划线',
                              },
                            ]}
                            tooltip="系统内唯一标识，如 custom-logo、my-chart"
                            style={{ marginBottom: 12 }}
                          >
                            <Input placeholder="例如: custom-logo" />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="title"
                            label="图标名称 (Title)"
                            tooltip="展示在搜索提示与悬浮提示中的名称"
                            style={{ marginBottom: 12 }}
                          >
                            <Input placeholder="例如: 业务看板" />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={12}>
                        <Col span={isNewCategory ? 12 : 24}>
                          <Form.Item
                            name="category"
                            label="所属分类"
                            style={{ marginBottom: 12 }}
                          >
                            <Select
                              showSearch
                              placeholder="搜索或选择分类"
                              optionFilterProp="label"
                              filterOption={(input, option) => {
                                if (!input) return true;
                                const lower = input.trim().toLowerCase();
                                const labelStr = String(option?.label || '');
                                const valueStr = String(option?.value || '');
                                return labelStr.toLowerCase().includes(lower) || valueStr.toLowerCase().includes(lower);
                              }}
                              options={[
                                ...categories.map((c) => ({ label: c === 'custom' ? '自定义 (默认)' : c, value: c })),
                                { label: '+ 新建分类...', value: '__new__' },
                              ]}
                              onChange={(val) => {
                                setIsNewCategory(val === '__new__');
                              }}
                            />
                          </Form.Item>
                        </Col>

                        {isNewCategory && (
                          <Col span={12}>
                            <Form.Item
                              name="newCategory"
                              label="新分类名称"
                              rules={[{ required: true, message: '请输入新分类名称' }]}
                              style={{ marginBottom: 12 }}
                            >
                              <Input placeholder="例如: 业务图标" />
                            </Form.Item>
                          </Col>
                        )}
                      </Row>

                      <Form.Item
                        name="svg"
                        label={
                          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                            <span>* SVG 代码内容</span>
                            {svgInput && (
                              <Button
                                type="link"
                                size="small"
                                icon={<ClearOutlined />}
                                onClick={() => {
                                  form.setFieldsValue({ svg: '' });
                                  setSvgInput('');
                                }}
                                style={{ padding: 0, height: 'auto', fontSize: 12 }}
                              >
                                清空
                              </Button>
                            )}
                          </div>
                        }
                        rules={[{ required: true, message: '请输入 SVG 代码' }]}
                        style={{ marginBottom: 16, flex: 1 }}
                      >
                        <TextArea
                          rows={6}
                          placeholder={`<svg viewBox="0 0 1024 1024" ...>\n  <path d="..." />\n</svg>`}
                          onChange={(e) => setSvgInput(e.target.value)}
                          style={{
                            fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                            fontSize: 12,
                            borderRadius: 6,
                          }}
                        />
                      </Form.Item>

                      <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 6 }}>
                        <Button onClick={onClose}>取消</Button>
                        <Button type="primary" loading={loading} onClick={handleSingleSubmit}>
                          保存并添加到分类
                        </Button>
                      </div>
                    </Form>
                  </Col>

                  {/* 右侧：常驻实时渲染看板 (46%) */}
                  <Col xs={24} md={11} style={{ display: 'flex', flexDirection: 'column' }}>
                    <Card
                      size="small"
                      style={{
                        height: '100%',
                        borderRadius: 8,
                        display: 'flex',
                        flexDirection: 'column',
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#fafafa',
                        borderColor: token.colorBorderSecondary,
                      }}
                      bodyStyle={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        padding: 14,
                      }}
                    >
                      {/* 看板顶部控制栏 */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <Space size={6}>
                          <PictureOutlined style={{ color: '#1677ff' }} />
                          <Text strong style={{ fontSize: 13 }}>实时渲染效果看板</Text>
                        </Space>
                        <Segmented
                          size="small"
                          value={previewBgMode}
                          onChange={(val: any) => setPreviewBgMode(val)}
                          options={[
                            { label: '透明棋盘', value: 'checker' },
                            { label: '浅底', value: 'light' },
                            { label: '深底', value: 'dark' },
                          ]}
                        />
                      </div>

                      {/* 主预览大图视口 */}
                      <div
                        style={{
                          height: 120,
                          borderRadius: 6,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                          overflow: 'hidden',
                          transition: 'all 0.3s',
                          ...getPreviewBgStyle(),
                        }}
                      >
                        {previewInfo.isValid ? (
                          <div
                            style={{
                              fontSize: 56,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: previewBgMode === 'dark' ? '#52c41a' : (isDark ? '#4096ff' : '#1677ff'),
                              transition: 'all 0.2s',
                            }}
                            dangerouslySetInnerHTML={{ __html: previewInfo.cleanSvg }}
                          />
                        ) : (
                          <div style={{ textAlign: 'center', color: token.colorTextQuaternary, padding: 12 }}>
                            <PictureOutlined style={{ fontSize: 32, marginBottom: 6, display: 'block' }} />
                            <span style={{ fontSize: 12 }}>在左侧粘贴 SVG 代码即可实时渲染</span>
                          </div>
                        )}
                      </div>

                      {/* 多尺寸横向对比矩阵 */}
                      <div style={{ marginTop: 14 }}>
                        <div style={{ fontSize: 12, color: token.colorTextTertiary, marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                          <span>真实应用场景标准尺寸对比：</span>
                          <span>{previewInfo.isValid ? '渲染就绪' : '等待输入'}</span>
                        </div>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: 8,
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#ffffff',
                            padding: '10px 8px',
                            borderRadius: 6,
                            border: `1px solid ${token.colorBorderSecondary}`,
                          }}
                        >
                          {/* 16px */}
                          <div style={{ textAlign: 'center' }}>
                            <div
                              style={{
                                height: 36,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 16,
                                color: token.colorText,
                              }}
                            >
                              {previewInfo.isValid ? (
                                <span dangerouslySetInnerHTML={{ __html: previewInfo.cleanSvg }} />
                              ) : (
                                <span style={{ color: token.colorTextQuaternary }}>-</span>
                              )}
                            </div>
                            <div style={{ fontSize: 11, color: token.colorTextTertiary, marginTop: 2 }}>16px 菜单</div>
                          </div>

                          {/* 24px */}
                          <div style={{ textAlign: 'center' }}>
                            <div
                              style={{
                                height: 36,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 24,
                                color: '#1677ff',
                              }}
                            >
                              {previewInfo.isValid ? (
                                <span dangerouslySetInnerHTML={{ __html: previewInfo.cleanSvg }} />
                              ) : (
                                <span style={{ color: token.colorTextQuaternary }}>-</span>
                              )}
                            </div>
                            <div style={{ fontSize: 11, color: token.colorTextTertiary, marginTop: 2 }}>24px 工具栏</div>
                          </div>

                          {/* 32px */}
                          <div style={{ textAlign: 'center' }}>
                            <div
                              style={{
                                height: 36,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 32,
                                color: '#52c41a',
                              }}
                            >
                              {previewInfo.isValid ? (
                                <span dangerouslySetInnerHTML={{ __html: previewInfo.cleanSvg }} />
                              ) : (
                                <span style={{ color: token.colorTextQuaternary }}>-</span>
                              )}
                            </div>
                            <div style={{ fontSize: 11, color: token.colorTextTertiary, marginTop: 2 }}>32px 卡片</div>
                          </div>

                          {/* 48px */}
                          <div style={{ textAlign: 'center' }}>
                            <div
                              style={{
                                height: 36,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 44,
                                color: '#faad14',
                              }}
                            >
                              {previewInfo.isValid ? (
                                <span dangerouslySetInnerHTML={{ __html: previewInfo.cleanSvg }} />
                              ) : (
                                <span style={{ color: token.colorTextQuaternary }}>-</span>
                              )}
                            </div>
                            <div style={{ fontSize: 11, color: token.colorTextTertiary, marginTop: 2 }}>48px 徽章</div>
                          </div>
                        </div>
                      </div>

                      {/* SVG 规范诊断状态标签 */}
                      <div style={{ marginTop: 'auto', paddingTop: 12 }}>
                        <div style={{ fontSize: 12, color: token.colorTextTertiary, marginBottom: 6 }}>
                          SVG 规范与技术诊断：
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {previewInfo.viewBox ? (
                            <Tag color="success" icon={<CheckCircleOutlined />}>
                              viewBox: {previewInfo.viewBox}
                            </Tag>
                          ) : (
                            <Tag color="warning" icon={<InfoCircleOutlined />}>
                              未指定 viewBox (建议添加)
                            </Tag>
                          )}

                          {previewInfo.hasCurrentColor ? (
                            <Tag color="processing" icon={<BgColorsOutlined />}>
                              色彩继承 (支持跟随主题色)
                            </Tag>
                          ) : (
                            <Tag color="default">
                              内置固定颜色
                            </Tag>
                          )}

                          {previewInfo.pathCount > 0 && (
                            <Tag color="cyan">
                              {previewInfo.pathCount} 个 Path 节点
                            </Tag>
                          )}
                        </div>
                      </div>
                    </Card>
                  </Col>
                </Row>
              </div>
            ),
          },
          {
            key: 'batch',
            label: (
              <span style={{ fontSize: 14 }}>
                <CloudUploadOutlined /> 批量导入中心
                {batchItems.length > 0 && (
                  <Tag color="processing" style={{ marginLeft: 6, borderRadius: 10 }}>
                    {batchItems.length}
                  </Tag>
                )}
              </span>
            ),
            children: (
              <div style={{ paddingTop: 4 }}>
                {/* 归属分类选择条 */}
                <div
                  style={{
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#fafafa',
                    padding: '10px 14px',
                    borderRadius: 6,
                    border: `1px solid ${token.colorBorderSecondary}`,
                    marginBottom: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 12,
                  }}
                >
                  <Space align="center">
                    <span style={{ fontWeight: 500, fontSize: 13 }}>导入归属分类：</span>
                    <Select
                      value={isNewBatchCategory ? '__new__' : batchCategory}
                      onChange={(val) => {
                        if (val === '__new__') {
                          setIsNewBatchCategory(true);
                        } else {
                          setIsNewBatchCategory(false);
                          setBatchCategory(val);
                        }
                      }}
                      style={{ width: 180 }}
                      showSearch
                      optionFilterProp="label"
                      options={[
                        ...categories.map((c) => ({ label: c === 'custom' ? '自定义 (默认)' : c, value: c })),
                        { label: '+ 新建分类...', value: '__new__' },
                      ]}
                    />
                    {isNewBatchCategory && (
                      <Input
                        value={newBatchCategoryInput}
                        onChange={(e) => setNewBatchCategoryInput(e.target.value)}
                        placeholder="输入新分类名称"
                        style={{ width: 160 }}
                      />
                    )}
                  </Space>

                  <Text type="secondary" style={{ fontSize: 12 }}>
                    导入的所有图标将自动存入此分类，并持久化到系统核心数据库与存储中
                  </Text>
                </div>

                {/* 来源模式分流切换器 */}
                <div style={{ marginBottom: 14 }}>
                  <Segmented
                    block
                    value={batchSourceType}
                    onChange={(val: any) => setBatchSourceType(val)}
                    options={[
                      {
                        label: (
                          <Space size={6} style={{ padding: '4px 0' }}>
                            <FileAddOutlined /> 本地 SVG 多文件拖拽
                          </Space>
                        ),
                        value: 'file',
                      },
                      {
                        label: (
                          <Space size={6} style={{ padding: '4px 0', color: '#ff4400' }}>
                            <GlobalOutlined /> Iconfont 平台合辑链接
                          </Space>
                        ),
                        value: 'iconfont',
                      },
                      {
                        label: (
                          <Space size={6} style={{ padding: '4px 0' }}>
                            <CodeOutlined /> Symbol / 多 SVG 源码解析
                          </Space>
                        ),
                        value: 'symbol',
                      },
                    ]}
                  />
                </div>

                {/* 分流内容区 */}
                {batchSourceType === 'file' && (
                  <Upload.Dragger
                    multiple
                    accept=".svg"
                    showUploadList={false}
                    beforeUpload={(_, fileList) => {
                      handleFilesUpload(fileList);
                      return false;
                    }}
                    style={{
                      borderRadius: 8,
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#fff',
                      borderColor: token.colorBorderSecondary,
                      padding: '16px 0',
                    }}
                  >
                    <p className="ant-upload-drag-icon" style={{ marginBottom: 8 }}>
                      <InboxOutlined style={{ color: '#1677ff', fontSize: 36 }} />
                    </p>
                    <p className="ant-upload-text" style={{ fontSize: 14, fontWeight: 500 }}>
                      点击选择或直接将多个 .svg 文件拖拽到此处
                    </p>
                    <p className="ant-upload-hint" style={{ fontSize: 12 }}>
                      支持批量多选，文件名将自动识别为图标标识与中文名称，并自动规范化清洗
                    </p>
                  </Upload.Dragger>
                )}

                {batchSourceType === 'iconfont' && (
                  <Card
                    style={{
                      borderRadius: 8,
                      backgroundColor: isDark ? 'rgba(255, 68, 0, 0.04)' : '#fffaf8',
                      borderColor: isDark ? 'rgba(255, 68, 0, 0.3)' : '#ffbb96',
                    }}
                    bodyStyle={{ padding: 16 }}
                  >
                    <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Space>
                        <GlobalOutlined style={{ color: '#ff4400' }} />
                        <Text strong style={{ color: isDark ? '#ff7a45' : '#d4380d' }}>
                          从阿里巴巴矢量图标库 (Iconfont.cn) 合辑一键直接导入
                        </Text>
                      </Space>
                      <a href="https://www.iconfont.cn/" target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#ff4400' }}>
                        访问 Iconfont 官网 ↗
                      </a>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <Input
                        value={iconfontUrlInput}
                        onChange={(e) => setIconfontUrlInput(e.target.value)}
                        placeholder="粘贴 Iconfont 合辑链接，例如：https://www.iconfont.cn/collections/detail?cid=54546 或纯数字 54546"
                        allowClear
                        onPressEnter={handleFetchIconfontCollection}
                        disabled={fetchingIconfont}
                        style={{ borderRadius: 6 }}
                      />
                      <Button
                        type="primary"
                        style={{ backgroundColor: '#ff4400', borderColor: '#ff4400', borderRadius: 6, flexShrink: 0 }}
                        icon={fetchingIconfont ? <SyncOutlined spin /> : <CloudDownloadOutlined />}
                        loading={fetchingIconfont}
                        onClick={handleFetchIconfontCollection}
                      >
                        一键拉取并导入
                      </Button>
                    </div>
                    <div style={{ fontSize: 12, color: token.colorTextTertiary, marginTop: 8 }}>
                      系统服务端将自动抓取该公开合辑中的所有高清 SVG 矢量，无需手动下载 Zip 解压，一键全自动入库。
                    </div>
                  </Card>
                )}

                {batchSourceType === 'symbol' && (
                  <Card
                    style={{
                      borderRadius: 8,
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#ffffff',
                      borderColor: token.colorBorderSecondary,
                    }}
                    bodyStyle={{ padding: 16 }}
                  >
                    <div style={{ marginBottom: 10 }}>
                      <Text strong style={{ fontSize: 13 }}>粘贴包含多个图标的源码文本：</Text>
                      <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                        支持包含多个 {'<symbol id="icon-xxx">...</symbol>'} 的 Iconfont SVG 源码，或多个 {'<svg>...</svg>'} 连续文本
                      </Text>
                    </div>
                    <TextArea
                      rows={4}
                      value={batchRawText}
                      onChange={(e) => setBatchRawText(e.target.value)}
                      placeholder={`<svg ...><symbol id="icon-home">...</symbol><symbol id="icon-user">...</symbol></svg>`}
                      style={{
                        fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                        fontSize: 12,
                        borderRadius: 6,
                        marginBottom: 10,
                      }}
                    />
                    <div style={{ textAlign: 'right' }}>
                      <Button
                        type="primary"
                        icon={<CodeOutlined />}
                        onClick={handleParseBatchText}
                        style={{ borderRadius: 6 }}
                      >
                        解析文本中的图标
                      </Button>
                    </div>
                  </Card>
                )}

                {/* 待导入清单展示卡片 */}
                {batchItems.length > 0 && (
                  <Card
                    style={{
                      marginTop: 16,
                      borderRadius: 8,
                      borderColor: '#52c41a',
                      backgroundColor: isDark ? 'rgba(82, 196, 26, 0.04)' : '#f6ffed',
                    }}
                    bodyStyle={{ padding: '12px 16px' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <Space>
                        <CheckCircleOutlined style={{ color: '#52c41a' }} />
                        <Text strong style={{ color: isDark ? '#73d13d' : '#389e0d' }}>
                          待导入就绪列表 ({batchItems.length} 款图标)
                        </Text>
                      </Space>
                      <Space size={8}>
                        <Button size="small" onClick={() => setBatchItems([])}>
                          清空待导入
                        </Button>
                        <Button
                          type="primary"
                          size="small"
                          loading={loading}
                          onClick={handleExecuteBatchImport}
                          style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                        >
                          确认全部导入 ({batchItems.length})
                        </Button>
                      </Space>
                    </div>

                    <div
                      style={{
                        maxHeight: 180,
                        overflowY: 'auto',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                        gap: 8,
                        padding: 4,
                      }}
                    >
                      {batchItems.map((item, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 8px',
                            borderRadius: 6,
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#ffffff',
                            border: `1px solid ${token.colorBorderSecondary}`,
                            fontSize: 12,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                            <span
                              style={{
                                fontSize: 18,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                color: '#1677ff',
                              }}
                              dangerouslySetInnerHTML={{ __html: item.svg }}
                            />
                            <Text ellipsis style={{ fontSize: 12 }}>
                              {item.title || item.name}
                            </Text>
                          </div>
                          <Tooltip title="移除此项">
                            <Button
                              type="text"
                              size="small"
                              icon={<DeleteOutlined style={{ fontSize: 11, color: '#ff4d4f' }} />}
                              onClick={() => setBatchItems((prev) => prev.filter((_, i) => i !== idx))}
                              style={{ width: 20, height: 20, padding: 0 }}
                            />
                          </Tooltip>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            ),
          },
        ]}
      />
    </Modal>
  );
};
