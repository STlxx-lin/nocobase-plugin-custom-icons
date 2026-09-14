import React, { useState, useEffect } from 'react';
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
  Table,
  Popconfirm,
  Tag,
  Alert,
  theme,
} from 'antd';
import {
  InboxOutlined,
  PlusOutlined,
  DeleteOutlined,
  CloudUploadOutlined,
  AppstoreAddOutlined,
  UnorderedListOutlined,
  EditOutlined,
  SyncOutlined,
  CloudDownloadOutlined,
} from '@ant-design/icons';
import { customIconsManager, CustomIconItem } from '../services/custom-icons-manager';
import { sanitizeAndFormatSvg, parseBatchSvgString } from '../utils/svg-helper';
import { EditIconModal } from './EditIconModal';

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
  const [activeTab, setActiveTab] = useState('single');
  const [form] = Form.useForm();
  const [svgInput, setSvgInput] = useState('');
  const [previewError, setPreviewError] = useState('');
  const [categories, setCategories] = useState<string[]>(['custom']);
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [loading, setLoading] = useState(false);

  // 批量导入状态
  const [batchItems, setBatchItems] = useState<Array<{ name: string; title: string; svg: string }>>([]);
  const [batchCategory, setBatchCategory] = useState('custom');

  // Iconfont 合辑快速导入状态
  const [iconfontUrlInput, setIconfontUrlInput] = useState('');
  const [fetchingIconfont, setFetchingIconfont] = useState(false);

  // 图标列表管理状态
  const [allIcons, setAllIcons] = useState<CustomIconItem[]>([]);
  const [filterCategory, setFilterCategory] = useState('all');
  const [tableSearch, setTableSearch] = useState('');
  const [editingIcon, setEditingIcon] = useState<CustomIconItem | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  useEffect(() => {
    if (open) {
      refreshData();
    }
  }, [open]);

  const refreshData = () => {
    setCategories(customIconsManager.getCategories());
    setAllIcons(customIconsManager.getAllIcons());
  };

  // 单个 SVG 预览计算
  let sanitizedPreviewSvg = '';
  try {
    if (svgInput.trim()) {
      sanitizedPreviewSvg = sanitizeAndFormatSvg(svgInput);
    }
  } catch (err: any) {
    // 忽略实时解析过程中的错误
  }

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
    message.success(`已解析 ${items.length} 个 SVG 文件`);
    return false;
  };

  // 处理粘贴批量文本解析
  const handleParseBatchText = (text: string) => {
    if (!text?.trim()) return;
    const items = parseBatchSvgString(text);
    if (items.length === 0) {
      message.warning('未检测到有效的 SVG 或 Iconfont Symbol 标签');
      return;
    }
    setBatchItems(items);
    message.success(`成功识别出 ${items.length} 个图标`);
  };

  // 执行批量导入
  const handleExecuteBatchImport = async () => {
    if (batchItems.length === 0) {
      message.warning('请先上传或解析待导入的图标');
      return;
    }

    setLoading(true);
    try {
      const itemsToImport = batchItems.map((item) => ({
        ...item,
        category: batchCategory,
        source: 'batch',
      }));

      const count = await customIconsManager.batchImportIcons(itemsToImport, apiClient);
      message.success(`成功批量导入 ${count} 个图标到分类 [${batchCategory}]！`);
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
            category: batchCategory.trim() || undefined,
          },
        });
      } catch (e1) {
        res = await apiClient.request({
          url: 'custom_icon_repos:importIconfont',
          method: 'post',
          data: {
            input: iconfontUrlInput.trim(),
            category: batchCategory.trim() || undefined,
          },
        });
      }
      const result = res?.data?.data || res?.data || {};
      message.success(
        `恭喜！成功从 Iconfont 导入 [${result.title || '合辑'}]，共 ${result.total || 0} 款矢量图标！已自动分类至 [${result.category || batchCategory}]`,
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


  // 删除图标
  const handleDeleteIcon = async (record: CustomIconItem) => {
    try {
      await customIconsManager.deleteIcon({ id: record.id, name: record.name }, apiClient);
      message.success(`图标 [${record.name}] 已删除`);
      refreshData();
    } catch (err: any) {
      message.error(err?.message || '删除失败');
    }
  };

  // 过滤管理列表
  const filteredTableIcons = allIcons.filter((item) => {
    const matchCat = filterCategory === 'all' || item.category === filterCategory;
    const matchSearch =
      !tableSearch ||
      item.name.toLowerCase().includes(tableSearch.toLowerCase()) ||
      (item.title && item.title.toLowerCase().includes(tableSearch.toLowerCase()));
    return matchCat && matchSearch;
  });

  return (
    <Modal
      title={
        <Space>
          <AppstoreAddOutlined style={{ color: '#1677ff' }} />
          <span>自定义图标库与 SVG 扩展</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={720}
      destroyOnClose
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'single',
            label: (
              <span>
                <PlusOutlined /> 自定义输入 SVG
              </span>
            ),
            children: (
              <div style={{ paddingTop: 8 }}>
                <Alert
                  type="info"
                  showIcon
                  message="输入或粘贴任意 SVG 矢量代码，系统将自动清洗并规范化为响应式自适应图标，自动保存到所选分类中。"
                  style={{ marginBottom: 16 }}
                />

                <Form form={form} layout="vertical" initialValues={{ category: 'custom' }}>
                  <Space direction="horizontal" align="start" style={{ width: '100%', gap: 16 }}>
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
                      tooltip="全系统唯一，如 custom:home、logo-brand 等"
                      style={{ width: 320 }}
                    >
                      <Input placeholder="例如: custom-logo、my-chart" />
                    </Form.Item>

                    <Form.Item
                      name="title"
                      label="图标名称 (Title)"
                      tooltip="展示在中英文搜索与悬浮提示中的中文名称"
                      style={{ width: 320 }}
                    >
                      <Input placeholder="例如: 公司徽标、数据看板" />
                    </Form.Item>
                  </Space>

                  <Space direction="horizontal" align="start" style={{ width: '100%', gap: 16 }}>
                    <Form.Item
                      name="category"
                      label="所属分类"
                      style={{ width: isNewCategory ? 200 : 320 }}
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

                    {isNewCategory && (
                      <Form.Item
                        name="newCategory"
                        label="新分类名称"
                        rules={[{ required: true, message: '请输入新分类名称' }]}
                        style={{ width: 220 }}
                      >
                        <Input placeholder="例如: 业务图标、营销风格" />
                      </Form.Item>
                    )}
                  </Space>

                  <Form.Item
                    name="svg"
                    label="SVG 代码内容"
                    rules={[{ required: true, message: '请输入 SVG 代码' }]}
                  >
                    <TextArea
                      rows={5}
                      placeholder={`<svg viewBox="0 0 1024 1024" ...>\n  <path d="..." />\n</svg>`}
                      onChange={(e) => setSvgInput(e.target.value)}
                    />
                  </Form.Item>

                  {/* 实时预览面板 */}
                  {sanitizedPreviewSvg ? (
                    <Card
                      size="small"
                      title="实时渲染效果预览"
                      style={{
                        marginBottom: 16,
                        backgroundColor: token.colorFillAlter,
                        border: `1px solid ${token.colorBorderSecondary}`,
                      }}
                    >
                      <Space size="large" align="center">
                        <div style={{ textAlign: 'center' }}>
                          <div
                            style={{
                              fontSize: 16,
                              padding: 8,
                              border: `1px dashed ${token.colorBorderSecondary}`,
                              borderRadius: 4,
                              display: 'inline-flex',
                            }}
                            dangerouslySetInnerHTML={{ __html: sanitizedPreviewSvg }}
                          />
                          <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>16px (正文/菜单)</div>
                        </div>

                        <div style={{ textAlign: 'center' }}>
                          <div
                            style={{
                              fontSize: 24,
                              color: '#1677ff',
                              padding: 8,
                              border: `1px dashed ${token.colorBorderSecondary}`,
                              borderRadius: 4,
                              display: 'inline-flex',
                            }}
                            dangerouslySetInnerHTML={{ __html: sanitizedPreviewSvg }}
                          />
                          <div style={{ fontSize: 12, color: token.colorTextTertiary, marginTop: 4 }}>24px (高亮主色)</div>
                        </div>

                        <div style={{ textAlign: 'center' }}>
                          <div
                            style={{
                              fontSize: 32,
                              color: '#52c41a',
                              padding: 8,
                              border: `1px dashed ${token.colorBorderSecondary}`,
                              borderRadius: 4,
                              display: 'inline-flex',
                            }}
                            dangerouslySetInnerHTML={{ __html: sanitizedPreviewSvg }}
                          />
                          <div style={{ fontSize: 12, color: token.colorTextTertiary, marginTop: 4 }}>32px (大图标)</div>
                        </div>
                      </Space>
                    </Card>
                  ) : null}

                  <div style={{ textAlign: 'right' }}>
                    <Space>
                      <Button onClick={onClose}>取消</Button>
                      <Button type="primary" loading={loading} onClick={handleSingleSubmit}>
                        保存并添加到分类
                      </Button>
                    </Space>
                  </div>
                </Form>
              </div>
            ),
          },
          {
            key: 'batch',
            label: (
              <span>
                <CloudUploadOutlined /> 批量导入 / 外部图标库
              </span>
            ),
            children: (
              <div style={{ paddingTop: 8 }}>
                <Space direction="vertical" style={{ width: '100%' }} size="middle">

                  <Divider orientation="left" style={{ margin: '8px 0', fontSize: 13 }}>
                    批量上传本地 SVG 文件
                  </Divider>

                  <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 8 }}>
                    <span>导入归属分类：</span>
                    <Input
                      style={{ width: 200 }}
                      value={batchCategory}
                      placeholder="分类名，如 custom、remix"
                      onChange={(e) => setBatchCategory(e.target.value)}
                    />
                  </div>

                  <Upload.Dragger
                    multiple
                    accept=".svg"
                    showUploadList={false}
                    beforeUpload={(_, fileList) => {
                      handleFilesUpload(fileList);
                      return false;
                    }}
                  >
                    <p className="ant-upload-drag-icon">
                      <InboxOutlined style={{ color: '#1677ff' }} />
                    </p>
                    <p className="ant-upload-text">点击或将多个 .svg 文件拖拽到此处</p>
                    <p className="ant-upload-hint">支持多选同时上传，文件名将自动识别为图标标识与中文名称</p>
                  </Upload.Dragger>

                  <Divider orientation="left" style={{ margin: '8px 0', fontSize: 13, color: '#ff4400' }}>
                    从阿里巴巴 Iconfont 平台合辑一键直接导入
                  </Divider>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <Input
                      value={iconfontUrlInput}
                      onChange={(e) => setIconfontUrlInput(e.target.value)}
                      placeholder="粘贴 Iconfont 合辑链接，例如：https://www.iconfont.cn/collections/detail?cid=54546 或纯数字 54546"
                      allowClear
                      onPressEnter={handleFetchIconfontCollection}
                      disabled={fetchingIconfont}
                    />
                    <Button
                      type="primary"
                      style={{ backgroundColor: '#ff4400', borderColor: '#ff4400' }}
                      icon={fetchingIconfont ? <SyncOutlined spin /> : <CloudDownloadOutlined />}
                      loading={fetchingIconfont}
                      onClick={handleFetchIconfontCollection}
                    >
                      一键导入合辑
                    </Button>
                  </div>

                  <Divider orientation="left" style={{ margin: '8px 0', fontSize: 13 }}>
                    或者粘贴 Iconfont Symbol / 多个 SVG 代码
                  </Divider>

                  <TextArea
                    rows={3}
                    placeholder="可直接粘贴包含 <symbol id='icon-xxx'>...</symbol> 的 Iconfont 源码，或多个 <svg>...</svg>"
                    onBlur={(e) => handleParseBatchText(e.target.value)}
                  />

                  {batchItems.length > 0 && (
                    <Card size="small" title={`待导入列表 (${batchItems.length} 个图标)`}>
                      <div style={{ maxHeight: 160, overflowY: 'auto' }}>
                        <Space wrap size="small">
                          {batchItems.map((item, idx) => (
                            <Tag
                              key={idx}
                              closable
                              onClose={() => setBatchItems((prev) => prev.filter((_, i) => i !== idx))}
                            >
                              <span
                                style={{ display: 'inline-flex', verticalAlign: 'middle', marginRight: 4 }}
                                dangerouslySetInnerHTML={{ __html: item.svg }}
                              />
                              {item.name}
                            </Tag>
                          ))}
                        </Space>
                      </div>
                      <div style={{ marginTop: 12, textAlign: 'right' }}>
                        <Space>
                          <Button onClick={() => setBatchItems([])}>清空待导入</Button>
                          <Button type="primary" loading={loading} onClick={handleExecuteBatchImport}>
                            确认批量导入 ({batchItems.length})
                          </Button>
                        </Space>
                      </div>
                    </Card>
                  )}
                </Space>
              </div>
            ),
          },
          {
            key: 'manage',
            label: (
              <span>
                <UnorderedListOutlined /> 图标库管理 ({allIcons.length})
              </span>
            ),
            children: (
              <div style={{ paddingTop: 8 }}>
                <Space style={{ marginBottom: 12, width: '100%', justifyContent: 'space-between' }}>
                  <Space>
                    <span>分类筛选:</span>
                    <Select
                      value={filterCategory}
                      onChange={setFilterCategory}
                      style={{ width: 170 }}
                      showSearch
                      placeholder="搜索分类"
                      optionFilterProp="label"
                      filterOption={(input, option) => {
                        if (!input) return true;
                        const lower = input.trim().toLowerCase();
                        const labelStr = String(option?.label || '');
                        const valueStr = String(option?.value || '');
                        return labelStr.toLowerCase().includes(lower) || valueStr.toLowerCase().includes(lower);
                      }}
                      options={[
                        { label: '全部分类', value: 'all' },
                        ...categories.map((c) => ({ label: c, value: c })),
                      ]}
                    />
                  </Space>
                  <Input.Search
                    placeholder="搜索图标标识或名称"
                    allowClear
                    style={{ width: 220 }}
                    onSearch={setTableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                  />
                </Space>

                <Table
                  dataSource={filteredTableIcons}
                  rowKey="name"
                  size="small"
                  pagination={{ pageSize: 6 }}
                  columns={[
                    {
                      title: '预览',
                      dataIndex: 'svg',
                      width: 70,
                      align: 'center',
                      render: (svg: string) => (
                        <span
                          style={{ fontSize: 20, display: 'inline-flex' }}
                          dangerouslySetInnerHTML={{ __html: sanitizeAndFormatSvg(svg) }}
                        />
                      ),
                    },
                    {
                      title: '标识 (Name)',
                      dataIndex: 'name',
                      width: 180,
                      render: (name: string) => <Text code>{name}</Text>,
                    },
                    {
                      title: '名称',
                      dataIndex: 'title',
                      width: 150,
                      render: (title: string, r) => title || r.name,
                    },
                    {
                      title: '分类',
                      dataIndex: 'category',
                      width: 110,
                      render: (cat: string) => <Tag color="blue">{cat || 'custom'}</Tag>,
                    },
                    {
                      title: '操作',
                      width: 100,
                      align: 'center',
                      render: (_, record) => (
                        <Space size="small">
                          <Button
                            type="link"
                            icon={<EditOutlined />}
                            size="small"
                            onClick={() => {
                              setEditingIcon(record);
                              setEditModalOpen(true);
                            }}
                          />
                          <Popconfirm
                            title="确定删除此自定义图标吗？"
                            description="删除后已使用该图标的地方可能无法显示。"
                            onConfirm={() => handleDeleteIcon(record)}
                            okText="确定"
                            cancelText="取消"
                          >
                            <Button type="link" danger icon={<DeleteOutlined />} size="small" />
                          </Popconfirm>
                        </Space>
                      ),
                    },
                  ]}
                />
              </div>
            ),
          },
        ]}
      />

      <EditIconModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingIcon(null);
        }}
        icon={editingIcon}
        apiClient={apiClient}
        onSuccess={() => refreshData()}
      />
    </Modal>
  );
};
