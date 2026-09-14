import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Table, Typography, Tag, Popconfirm, message, Input, Select, Tabs, Switch, InputNumber, Alert, Divider, theme } from 'antd';
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
  const [activeTab, setActiveTab] = useState('installed');
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
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <Title level={4} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AppstoreAddOutlined style={{ color: '#1677ff' }} />
              自定义图标库与 SVG 扩展
            </Title>
            <Text type="secondary">
              支持一键安装官方与开源图标库（创造狮草莓图标库等）、自定义上传 SVG，并在系统菜单和各处原生无缝渲染。
            </Text>
          </div>

          <Space>
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
                  <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
                    <Space>
                      <span>分类筛选：</span>
                      <Select
                        style={{ width: 200 }}
                        value={filterCat}
                        onChange={setFilterCat}
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
                    </Space>

                    <Input.Search
                      placeholder="搜索图标名称或标识"
                      style={{ width: 260 }}
                      allowClear
                      onSearch={setSearchText}
                      onChange={(e) => setSearchText(e.target.value)}
                    />
                  </div>

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
                        borderTop: '1px solid #f0f0f0',
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
