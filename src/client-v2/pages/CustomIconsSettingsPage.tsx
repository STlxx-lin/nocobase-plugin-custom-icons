import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Table,
  Typography,
  Tag,
  Popconfirm,
  message,
  Input,
  Select,
  Tabs,
  Switch,
  InputNumber,
  Alert,
  Divider,
  Segmented,
  Tooltip,
  Pagination,
  Empty,
  theme,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  ReloadOutlined,
  AppstoreAddOutlined,
  EditOutlined,
  AppstoreOutlined,
  ShoppingOutlined,
  SettingOutlined,
  CheckOutlined,
  UndoOutlined,
  ThunderboltOutlined,
  TagsOutlined,
  BarsOutlined,
  CopyOutlined,
  CheckCircleFilled,
  FolderOpenOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import {
  customIconsManager,
  CustomIconItem,
  IconPaginationConfig,
  DEFAULT_PAGINATION_CONFIG,
} from '../services/custom-icons-manager';
import { sanitizeAndFormatSvg } from '../utils/svg-helper';
import { CustomIconModal } from '../components/CustomIconModal';
import { EditIconModal } from '../components/EditIconModal';
import { IconRepoMarket } from '../components/IconRepoMarket';
import { EnhancedIconPicker } from '../components/EnhancedIconPicker';
import { SubCategoriesSettingsPanel } from '../components/SubCategoriesSettingsPanel';

const { Title, Text } = Typography;

export const CustomIconsSettingsPage: React.FC<{ api: any }> = ({ api }) => {
  const { token } = theme.useToken();
  const isDark = React.useMemo(() => {
    if (token.colorBgContainer === '#141414' || token.colorBgBase === '#000' || token.colorBgBase === '#000000') return true;
    const bg = token.colorBgContainer || '#ffffff';
    if (bg.startsWith('#') && (bg.length === 7 || bg.length === 4)) {
      const hex = bg.length === 4 ? bg.slice(1).split('').map((c) => c + c).join('') : bg.slice(1);
      const r = parseInt(hex.substring(0, 2), 16) || 0;
      const g = parseInt(hex.substring(2, 4), 16) || 0;
      const b = parseInt(hex.substring(4, 6), 16) || 0;
      return (r * 299 + g * 587 + b * 114) / 1000 < 128;
    }
    return false;
  }, [token.colorBgContainer, token.colorBgBase]);

  const [activeTab, setActiveTab] = useState('installed');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [gridPage, setGridPage] = useState<number>(1);
  const [gridPageSize, setGridPageSize] = useState<number>(48);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIcon, setEditingIcon] = useState<CustomIconItem | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [icons, setIcons] = useState<CustomIconItem[]>([]);
  const [categories, setCategories] = useState<string[]>(['custom']);
  const [filterCat, setFilterCat] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [paginationSettings, setPaginationSettings] = useState<IconPaginationConfig>(
    customIconsManager.getPaginationConfig(),
  );
  const [savingSettings, setSavingSettings] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      await customIconsManager.loadIcons(api);
      setIcons(customIconsManager.getAllIcons());
      setCategories(customIconsManager.getCategories());
      const cfg = await customIconsManager.loadPaginationConfig(api);
      if (cfg) setPaginationSettings(cfg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = customIconsManager.subscribe(() => {
      setIcons(customIconsManager.getAllIcons());
      setCategories(customIconsManager.getCategories());
      setPaginationSettings(customIconsManager.getPaginationConfig());
    });
    return unsub;
  }, []);

  const handleSavePaginationSettings = async () => {
    setSavingSettings(true);
    try {
      await customIconsManager.savePaginationConfig(paginationSettings, api);
      message.success('分页与性能配置已成功保存，全站图标选择器已即时生效！');
    } catch (e: any) {
      message.error('保存失败: ' + (e?.message || '未知错误'));
    } finally {
      setSavingSettings(false);
    }
  };

  const handleResetPaginationSettings = () => {
    setPaginationSettings({ ...DEFAULT_PAGINATION_CONFIG });
    message.info('已重置为系统推荐默认值（开启分页、阈值 500、每页 200、典型展示 10 款、宽屏 44em），请点击「保存配置」完成持久化。');
  };

  const handleDelete = async (record: CustomIconItem) => {
    try {
      await customIconsManager.deleteIcon({ id: record.id, name: record.name }, api);
      message.success(`图标 [${record.name}] 已删除`);
    } catch (err: any) {
      message.error(err?.message || '删除失败');
    }
  };

  const filteredIcons = icons.filter((item) => {
    const matchCat = filterCat === 'all' || item.category === filterCat;
    const matchSearch =
      !searchText ||
      item.name.toLowerCase().includes(searchText.toLowerCase()) ||
      (item.title && item.title.toLowerCase().includes(searchText.toLowerCase()));
    return matchCat && matchSearch;
  });

  return (
    <div style={{ padding: '16px 24px', width: '100%', boxSizing: 'border-box' }}>
      <style>{`
        .custom-icon-gallery-card:hover {
          box-shadow: 0 4px 16px ${isDark ? 'rgba(0, 0, 0, 0.65)' : 'rgba(22, 119, 255, 0.16)'};
          border-color: ${token.colorPrimary} !important;
          transform: translateY(-2px);
        }
        .custom-icon-gallery-card:hover .custom-icon-gallery-hover-actions {
          opacity: 1 !important;
          pointer-events: auto !important;
        }
      `}</style>

      <Card bodyStyle={{ padding: '20px 24px' }}>
        {/* 页头标题与主操作栏 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <Title level={4} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AppstoreAddOutlined style={{ color: token.colorPrimary }} />
              自定义图标库与 SVG 扩展
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              支持一键安装官方与开源图标库（创造狮草莓、Iconfont、Streamline、Iconmonstr、Iconify 等）、自定义上传 SVG，全站选择器即时同步。
            </Text>
          </div>

          <Space size={10}>
            <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>
              刷新数据
            </Button>
            {activeTab === 'installed' && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
                添加 / 批量导入图标
              </Button>
            )}
          </Space>
        </div>

        {/* 顶部沉浸式数据统计指标条 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: 12,
            marginBottom: 20,
            padding: '12px 18px',
            borderRadius: 8,
            backgroundColor: token.colorFillAlter,
            border: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 8, backgroundColor: isDark ? 'rgba(22, 119, 255, 0.16)' : '#e6f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <AppstoreOutlined style={{ fontSize: 20, color: '#1677ff' }} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: token.colorTextTertiary }}>已入库图标总量</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: token.colorText }}>
                {icons.length} <span style={{ fontSize: 12, fontWeight: 400, color: token.colorTextSecondary }}>款矢量</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 8, backgroundColor: isDark ? 'rgba(82, 196, 26, 0.16)' : '#f6ffed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FolderOpenOutlined style={{ fontSize: 20, color: '#52c41a' }} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: token.colorTextTertiary }}>生效图标分类</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: token.colorText }}>
                {categories.length} <span style={{ fontSize: 12, fontWeight: 400, color: token.colorTextSecondary }}>个分组</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 8, backgroundColor: isDark ? 'rgba(250, 140, 22, 0.16)' : '#fff7e6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ThunderboltOutlined style={{ fontSize: 20, color: '#fa8c16' }} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: token.colorTextTertiary }}>选择器分页保护</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: token.colorText }}>
                {paginationSettings.enablePagination ? (
                  <span style={{ color: '#52c41a' }}>已启用 <span style={{ fontSize: 12, fontWeight: 400, color: token.colorTextSecondary }}>(每页 {paginationSettings.pageSize || 200})</span></span>
                ) : (
                  <span style={{ color: token.colorTextTertiary }}>未启用</span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 8, backgroundColor: isDark ? 'rgba(114, 46, 209, 0.16)' : '#f9f0ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <SafetyCertificateOutlined style={{ fontSize: 20, color: '#722ed1' }} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: token.colorTextTertiary }}>持久化状态</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#52c41a', display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                <CheckCircleFilled style={{ fontSize: 14 }} /> 双重同步正常
              </div>
            </div>
          </div>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'installed',
              label: (
                <span>
                  <AppstoreOutlined /> 已安装图标 ({icons.length})
                </span>
              ),
              children: (
                <div style={{ paddingTop: 8 }}>
                  {/* 工具与筛选栏 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                      <Select
                        style={{ width: 220 }}
                        value={filterCat}
                        onChange={(val) => {
                          setFilterCat(val);
                          setGridPage(1);
                        }}
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
                          { label: '全部分类', value: 'all' },
                          ...categories.map((c) => ({
                            label: c === 'caomei' ? '草莓图标库 (caomei)' : c,
                            value: c,
                          })),
                        ]}
                      />

                      <Input.Search
                        placeholder="搜索图标名称、显示名或标识..."
                        style={{ width: 280 }}
                        allowClear
                        onSearch={(val) => {
                          setSearchText(val);
                          setGridPage(1);
                        }}
                        onChange={(e) => {
                          setSearchText(e.target.value);
                          setGridPage(1);
                        }}
                      />

                      <Text type="secondary" style={{ fontSize: 13 }}>
                        共匹配 <strong style={{ color: token.colorPrimary }}>{filteredIcons.length}</strong> 款图标
                      </Text>
                    </div>

                    <Segmented
                      value={viewMode}
                      onChange={(val) => setViewMode(val as 'grid' | 'table')}
                      options={[
                        { label: '网格画廊', value: 'grid', icon: <AppstoreOutlined /> },
                        { label: '表格列表', value: 'table', icon: <BarsOutlined /> },
                      ]}
                    />
                  </div>

                  {/* 网格画廊视图 */}
                  {viewMode === 'grid' ? (
                    filteredIcons.length === 0 ? (
                      <Empty style={{ margin: '48px 0' }} description="未找到匹配的图标" />
                    ) : (
                      <>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(116px, 1fr))',
                            gap: 12,
                            marginBottom: 20,
                          }}
                        >
                          {filteredIcons.slice((gridPage - 1) * gridPageSize, gridPage * gridPageSize).map((item) => (
                            <div
                              key={item.name}
                              className="custom-icon-gallery-card"
                              style={{
                                position: 'relative',
                                borderRadius: 8,
                                border: `1px solid ${token.colorBorderSecondary}`,
                                backgroundColor: token.colorFillAlter,
                                padding: '12px 8px 8px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                height: 116,
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                overflow: 'hidden',
                              }}
                            >
                              {/* 图标主体 */}
                              <div
                                style={{
                                  flex: 1,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 32,
                                  color: token.colorText,
                                }}
                                dangerouslySetInnerHTML={{ __html: sanitizeAndFormatSvg(item.svg) }}
                              />

                              {/* 图标标题文本 */}
                              <div
                                style={{
                                  width: '100%',
                                  textAlign: 'center',
                                  fontSize: 12,
                                  color: token.colorTextSecondary,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  marginTop: 4,
                                }}
                                title={item.title || item.name}
                              >
                                {item.title || item.name}
                              </div>

                              {/* 悬浮浮层工具条 */}
                              <div
                                className="custom-icon-gallery-hover-actions"
                                style={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                  backgroundColor: isDark ? 'rgba(20, 20, 20, 0.88)' : 'rgba(255, 255, 255, 0.95)',
                                  backdropFilter: 'blur(3px)',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 6,
                                  padding: 8,
                                  opacity: 0,
                                  pointerEvents: 'none',
                                  transition: 'opacity 0.2s ease',
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    color: token.colorText,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    width: '100%',
                                    textAlign: 'center',
                                  }}
                                  title={item.name}
                                >
                                  {item.name}
                                </div>
                                <Space size={6}>
                                  <Tooltip title="复制代码标识 (Name)">
                                    <Button
                                      size="small"
                                      shape="circle"
                                      icon={<CopyOutlined />}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigator.clipboard.writeText(item.name);
                                        message.success(`已复制标识: ${item.name}`);
                                      }}
                                    />
                                  </Tooltip>
                                  <Tooltip title="编辑图标">
                                    <Button
                                      size="small"
                                      shape="circle"
                                      icon={<EditOutlined />}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingIcon(item);
                                        setEditModalOpen(true);
                                      }}
                                    />
                                  </Tooltip>
                                  <Popconfirm
                                    title="确认删除该图标？"
                                    okText="删除"
                                    cancelText="取消"
                                    okButtonProps={{ danger: true }}
                                    onConfirm={(e) => {
                                      e?.stopPropagation();
                                      handleDelete(item);
                                    }}
                                  >
                                    <Tooltip title="删除图标">
                                      <Button
                                        size="small"
                                        shape="circle"
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                    </Tooltip>
                                  </Popconfirm>
                                </Space>
                                <Button
                                  type="link"
                                  size="small"
                                  style={{ fontSize: 11, padding: 0, height: 18 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(item.svg);
                                    message.success('已成功复制 SVG 矢量代码！');
                                  }}
                                >
                                  复制 SVG 代码
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <Pagination
                            current={gridPage}
                            pageSize={gridPageSize}
                            total={filteredIcons.length}
                            pageSizeOptions={['36', '48', '72', '96', '144']}
                            showSizeChanger
                            showQuickJumper
                            showTotal={(total, range) => `显示 ${range[0]}-${range[1]} 款 · 共 ${total} 款`}
                            onChange={(page, pageSize) => {
                              setGridPage(page);
                              setGridPageSize(pageSize);
                            }}
                          />
                        </div>
                      </>
                    )
                  ) : (
                    /* 表格列表视图 */
                    <Table
                      dataSource={filteredIcons}
                      rowKey="name"
                      loading={loading}
                      pagination={{ pageSize: 12, showTotal: (total) => `共 ${total} 个图标` }}
                      columns={[
                        {
                          title: '图标预览',
                          dataIndex: 'svg',
                          width: 90,
                          align: 'center',
                          render: (svg: string) => (
                            <span
                              style={{ fontSize: 24, display: 'inline-flex', verticalAlign: 'middle' }}
                              dangerouslySetInnerHTML={{ __html: sanitizeAndFormatSvg(svg) }}
                            />
                          ),
                        },
                        {
                          title: '唯一标识 (Name)',
                          dataIndex: 'name',
                          render: (name: string) => <Text copyable code>{name}</Text>,
                        },
                        {
                          title: '显示名称 (Title)',
                          dataIndex: 'title',
                          render: (title: string, r) => title || r.name,
                        },
                        {
                          title: '分类 (Category)',
                          dataIndex: 'category',
                          render: (cat: string) => (
                            <Tag color={cat === 'caomei' ? 'magenta' : 'blue'}>
                              {cat === 'caomei' ? '草莓图标库 (caomei)' : (cat || 'custom')}
                            </Tag>
                          ),
                        },
                        {
                          title: '来源',
                          dataIndex: 'source',
                          render: (src: string) => {
                            if (src?.startsWith('iconify:')) {
                              return <Tag color="geekblue">Iconify: {src.replace('iconify:', '')}</Tag>;
                            }
                            if (src?.startsWith('repo:')) {
                              return <Tag color="cyan">仓库: {src.replace('repo:', '')}</Tag>;
                            }
                            const map: Record<string, string> = {
                              manual: '手动输入',
                              upload: '文件上传',
                              batch: '批量导入',
                              preset: '精选预设',
                            };
                            return <Tag>{map[src] || src || '自定义'}</Tag>;
                          },
                        },
                        {
                          title: '操作',
                          width: 140,
                          align: 'center',
                          render: (_, record) => (
                            <Space size="small">
                              <Button
                                type="link"
                                size="small"
                                icon={<EditOutlined />}
                                onClick={() => {
                                  setEditingIcon(record);
                                  setEditModalOpen(true);
                                }}
                              >
                                编辑
                              </Button>
                              <Popconfirm
                                title="确认删除该图标？"
                                description="删除后，已引用此图标的菜单项或页面将无法显示该图标。"
                                okText="删除"
                                cancelText="取消"
                                okButtonProps={{ danger: true }}
                                onConfirm={() => handleDelete(record)}
                              >
                                <Button type="link" danger size="small" icon={<DeleteOutlined />}>
                                  删除
                                </Button>
                              </Popconfirm>
                            </Space>
                          ),
                        },
                      ]}
                    />
                  )}
                </div>
              ),
            },
            {
              key: 'repos',
              label: (
                <span>
                  <ShoppingOutlined /> Icon 仓库管理
                </span>
              ),
              children: <IconRepoMarket apiClient={api} onRepoChanged={() => loadData()} />,
            },
            {
              key: 'paginationSettings',
              label: (
                <span>
                  <SettingOutlined /> 分页与性能配置
                </span>
              ),
              children: (
                <div style={{ paddingTop: 12, maxWidth: 860 }}>
                  <Alert
                    type="info"
                    showIcon
                    icon={<ThunderboltOutlined style={{ color: '#1677ff' }} />}
                    message="图标选择器（IconPicker）智能分页保护"
                    description="当接入海量图标库（如 Iconmonstr 包含 2500+ 款图标，或全部分类/搜索匹配量极大）时，一次性挂载数千个 SVG DOM 元素会导致浏览器主线程阻塞与渲染卡顿。通过开启分页保护，选择器将自动切片秒开，大幅提升系统交互流畅度与内存健康度。"
                    style={{ marginBottom: 20 }}
                  />

                  <Card title="核心配置项" size="small" style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '8px 4px' }}>
                      {/* 1. 开启分页开关 */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>开启选择器智能分页保护</div>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            推荐开启。当分类或搜索结果中的图标数量较多时，自动在选择器底部呈现紧凑翻页器。
                          </Text>
                        </div>
                        <Switch
                          checked={paginationSettings.enablePagination}
                          onChange={(checked) =>
                            setPaginationSettings((prev) => ({ ...prev, enablePagination: checked }))
                          }
                        />
                      </div>

                      <Divider style={{ margin: '4px 0' }} />

                      {/* 2. 分页触发阈值 */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>分页触发阈值 (Threshold)</div>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            当某分类或搜索匹配的图标总数<strong>超过此数量</strong>时自动启用分页展示。设置为 0 则无条件总是分页。
                          </Text>
                        </div>
                        <Space>
                          <InputNumber
                            min={0}
                            max={10000}
                            step={50}
                            disabled={!paginationSettings.enablePagination}
                            value={paginationSettings.threshold}
                            onChange={(val) =>
                              setPaginationSettings((prev) => ({ ...prev, threshold: Number(val) || 0 }))
                            }
                            style={{ width: 140 }}
                            addonAfter="款"
                          />
                        </Space>
                      </div>

                      <Divider style={{ margin: '4px 0' }} />

                      {/* 3. 每页展示数量 */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>每页显示数量 (Page Size)</div>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            触发分页后，每页切片渲染的图标数量。推荐设置为 100 ~ 200 款，以平衡浏览视野与 DOM 性能。
                          </Text>
                        </div>
                        <Select
                          disabled={!paginationSettings.enablePagination}
                          value={paginationSettings.pageSize}
                          onChange={(val) => setPaginationSettings((prev) => ({ ...prev, pageSize: val }))}
                          style={{ width: 140 }}
                          options={[
                            { label: '50 款 / 页', value: 50 },
                            { label: '100 款 / 页', value: 100 },
                            { label: '200 款 / 页 (推荐)', value: 200 },
                            { label: '300 款 / 页', value: 300 },
                            { label: '500 款 / 页', value: 500 },
                          ]}
                        />
                      </div>

                      <Divider style={{ margin: '4px 0' }} />

                      {/* 4. 仓库市场卡片展示图标数量 */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>图库市场卡片典型图标展示数量</div>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            控制在「Icon 仓库管理」卡片中，已安装或预览区域直接引用并展示的典型图标数量（支持 1 ~ 30 款，推荐 5 ~ 12 款）。
                          </Text>
                        </div>
                        <InputNumber
                          min={1}
                          max={30}
                          step={1}
                          value={paginationSettings.marketPreviewCount ?? 10}
                          onChange={(val) =>
                            setPaginationSettings((prev) => ({
                              ...prev,
                              marketPreviewCount: Math.min(30, Math.max(1, Number(val) || 10)),
                            }))
                          }
                          style={{ width: 140 }}
                          addonAfter="款"
                        />
                      </div>

                      <Divider style={{ margin: '4px 0' }} />

                      {/* 5. 图标选择器浮层宽度配置 */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>图标选择器弹窗宽度 (Popover Width)</div>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            配置全站图标选择器弹窗浮层的显示宽度。支持宽屏大视野（推荐默认）、自适应伸缩（根据屏幕与子分类自动计算最佳视野）、预设宽度规格或自定义 CSS 宽度。
                          </Text>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <Select
                            value={
                              ['wide', 'adaptive', 'standard', 'extra-wide', 'compact'].includes(paginationSettings.popoverWidth || 'wide')
                                ? (paginationSettings.popoverWidth || 'wide')
                                : 'custom'
                            }
                            onChange={(val) => {
                              if (val === 'custom') {
                                setPaginationSettings((prev) => ({ ...prev, popoverWidth: '45em' }));
                              } else {
                                setPaginationSettings((prev) => ({ ...prev, popoverWidth: val }));
                              }
                            }}
                            style={{ width: 180 }}
                            options={[
                              { label: '🖼️ 宽屏大视野 (44em，推荐默认)', value: 'wide' },
                              { label: '⚡ 自适应伸缩 (随屏幕自适应)', value: 'adaptive' },
                              { label: '📏 标准紧凑 (35em / 28em)', value: 'standard' },
                              { label: '🖥️ 全景超宽 (54em)', value: 'extra-wide' },
                              { label: '📱 极窄模式 (30em)', value: 'compact' },
                              { label: '✏️ 自定义宽度', value: 'custom' },
                            ]}
                          />
                          {!['wide', 'adaptive', 'standard', 'extra-wide', 'compact'].includes(paginationSettings.popoverWidth || 'wide') && (
                            <Input
                              placeholder="例如: 45em 或 600px"
                              value={paginationSettings.popoverWidth}
                              onChange={(e) => {
                                const v = e.target.value;
                                setPaginationSettings((prev) => ({ ...prev, popoverWidth: v }));
                              }}
                              style={{ width: 130 }}
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: 24,
                        paddingTop: 16,
                        borderTop: `1px solid ${token.colorBorderSecondary}`,
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: 12,
                      }}
                    >
                      <Button icon={<UndoOutlined />} onClick={handleResetPaginationSettings}>
                        恢复推荐默认
                      </Button>
                      <Button
                        type="primary"
                        icon={<CheckOutlined />}
                        loading={savingSettings}
                        onClick={handleSavePaginationSettings}
                      >
                        保存配置并立即生效
                      </Button>
                    </div>
                  </Card>

                  {/* 实时效果演练区 */}
                  <Card
                    size="small"
                    title={
                      <span style={{ fontSize: 13, color: token.colorTextSecondary }}>
                        💡 现场实时演练与效果验证（无需离开本页即可体验）
                      </span>
                    }
                    style={{ backgroundColor: token.colorFillAlter, border: `1px solid ${token.colorBorderSecondary}` }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '8px 4px' }}>
                      <span style={{ fontSize: 13, color: token.colorTextSecondary }}>点击右侧测试选择器：</span>
                      <EnhancedIconPicker apiClient={api} />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        （在上方修改弹窗宽度、阈值或每页条数并保存后，直接点击此处打开，即可现场检验弹窗宽度与分页效果）
                      </Text>
                    </div>
                  </Card>
                </div>
              ),
            },
            {
              key: 'subCategories',
              label: (
                <span>
                  <TagsOutlined /> 分类规则配置
                </span>
              ),
              children: (
                <SubCategoriesSettingsPanel api={api} icons={icons} categories={categories} />
              ),
            },
          ]}
        />
      </Card>

      <CustomIconModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        apiClient={api}
        onSuccess={() => loadData()}
      />

      <EditIconModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingIcon(null);
        }}
        icon={editingIcon}
        apiClient={api}
        onSuccess={() => loadData()}
      />
    </div>
  );
};

export default CustomIconsSettingsPage;
