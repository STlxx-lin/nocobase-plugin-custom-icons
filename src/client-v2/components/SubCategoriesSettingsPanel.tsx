import React, { useState, useEffect, useMemo } from 'react';
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
  Radio,
  Modal,
  Form,
  Tooltip,
  Alert,
  Divider,
  Empty,
  Badge,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  UndoOutlined,
  CheckOutlined,
  CodeOutlined,
  TableOutlined,
  FormatPainterOutlined,
  QuestionCircleOutlined,
  CopyOutlined,
  ThunderboltOutlined,
  TagsOutlined,
} from '@ant-design/icons';
import {
  customIconsManager,
  CustomIconItem,
  RawSubCategoryConfig,
} from '../services/custom-icons-manager';
import subCategoriesPreset from '../config/sub-categories.json';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

export interface SubCategoriesSettingsPanelProps {
  api: any;
  icons: CustomIconItem[];
  categories: string[];
}

export const SubCategoriesSettingsPanel: React.FC<SubCategoriesSettingsPanelProps> = (props) => {
  const { api, icons = [], categories = [] } = props || {};
  const [config, setConfig] = useState<Record<string, RawSubCategoryConfig[]>>(
    customIconsManager.getSubCategoriesConfig(),
  );
  const [selectedCat, setSelectedCat] = useState<string>('caomei');
  const [mode, setMode] = useState<'table' | 'json'>('table');
  const [jsonText, setJsonText] = useState<string>('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  // 模态框：添加 / 编辑单条子分类
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [form] = Form.useForm();

  // 监听 manager 变化同步
  useEffect(() => {
    const unsub = customIconsManager.subscribe(() => {
      const cfg = customIconsManager.getSubCategoriesConfig();
      setConfig(cfg);
    });
    return unsub;
  }, []);

  // 每次切换大类或 config 变更，同步更新 jsonText
  useEffect(() => {
    try {
      setJsonText(JSON.stringify(config, null, 2));
      setJsonError(null);
    } catch (e) {}
  }, [config]);

  // 所有可供配置的大分类选项
  const categoryOptions = useMemo(() => {
    const defaultList = [
      { label: '🍓 草莓图标库 (caomei)', value: 'caomei' },
      { label: '🏛️ 系统内置官方图标 (builtin)', value: 'builtin' },
      { label: '🌐 通用图库规则 (universal)', value: 'universal' },
    ];

    const extraSet = new Set<string>();
    // 从现有 config 中收集
    Object.keys(config).forEach((k) => {
      if (!['caomei', 'builtin', 'universal'].includes(k)) {
        extraSet.add(k);
      }
    });
    // 从已安装图标的分类中收集
    categories.forEach((c) => {
      if (c && !['caomei', 'builtin', 'universal', 'custom'].includes(c)) {
        extraSet.add(c);
      }
    });

    const extras = Array.from(extraSet).map((k) => ({
      label: `📦 定制图库: ${k}`,
      value: k,
    }));

    return [...defaultList, ...extras];
  }, [config, categories]);

  // 当前大类的规则列表
  const currentRules: RawSubCategoryConfig[] = useMemo(() => {
    if (config[selectedCat] && Array.isArray(config[selectedCat])) {
      return config[selectedCat];
    }
    // 默认通用兜底
    return config['universal'] || (subCategoriesPreset as any).universal || [];
  }, [config, selectedCat]);

  // 当前大类下用于预览命中的图标列表
  const currentCategoryIcons = useMemo(() => {
    if (selectedCat === 'builtin') {
      return []; // 系统内置图标为 Antd 内置，命中测试使用当前已注册名称
    }
    return icons.filter((i) => (i.category || 'custom') === selectedCat);
  }, [icons, selectedCat]);

  // 规则匹配结果实时统计计算
  const ruleMatchStats = useMemo(() => {
    const stats: Record<number, { count: number; error?: string }> = {};
    const targetIcons = currentCategoryIcons;

    currentRules.forEach((rule, idx) => {
      if (!rule.matchType || rule.matchType === 'all' || !rule.pattern) {
        stats[idx] = { count: targetIcons.length };
        return;
      }
      if (rule.matchType === 'endsWith') {
        const p = rule.pattern;
        const count = targetIcons.filter((i) => i.name.endsWith(p)).length;
        stats[idx] = { count };
        return;
      }
      if (rule.matchType === 'notEndsWith') {
        const p = rule.pattern;
        const count = targetIcons.filter((i) => !i.name.endsWith(p)).length;
        stats[idx] = { count };
        return;
      }
      if (rule.matchType === 'regex') {
        try {
          const reg = new RegExp(rule.pattern, 'i');
          const count = targetIcons.filter((i) => reg.test(i.name)).length;
          stats[idx] = { count };
        } catch (e: any) {
          stats[idx] = { count: 0, error: '正则格式错误' };
        }
      }
    });
    return stats;
  }, [currentRules, currentCategoryIcons]);

  // 保存当前修改
  const handleSave = async (customCfg?: Record<string, RawSubCategoryConfig[]>) => {
    const targetCfg = customCfg || config;
    setSaving(true);
    try {
      await customIconsManager.saveSubCategoriesConfig(targetCfg, api);
      message.success('分类规则已成功持久化并广播，全站图标选择器子分类已即刻生效！');
    } catch (e: any) {
      message.error('保存失败: ' + (e?.message || '网络异常'));
    } finally {
      setSaving(false);
    }
  };

  // 重置全部为初始预设
  const handleResetAll = async () => {
    setSaving(true);
    try {
      await customIconsManager.resetSubCategoriesConfig(api);
      const def = (subCategoriesPreset as any) || {};
      setConfig(def);
      setJsonText(JSON.stringify(def, null, 2));
      message.info('已恢复为官方推荐初始分类规则，全站图标选择器已同步重置。');
    } catch (e: any) {
      message.error('重置失败: ' + (e?.message || '网络异常'));
    } finally {
      setSaving(false);
    }
  };

  // 恢复当前大类为预设
  const handleResetCurrentCat = () => {
    const def = (subCategoriesPreset as any)?.[selectedCat] || (subCategoriesPreset as any)?.universal || [];
    const nextConfig = {
      ...config,
      [selectedCat]: JSON.parse(JSON.stringify(def)),
    };
    setConfig(nextConfig);
    message.info(`已将 [${selectedCat}] 分类规则重置为官方预设，点击「保存配置」即可完成提交。`);
  };

  // 删除单条规则
  const handleDeleteRule = (index: number) => {
    const nextRules = [...currentRules];
    nextRules.splice(index, 1);
    const nextConfig = {
      ...config,
      [selectedCat]: nextRules,
    };
    setConfig(nextConfig);
    message.success('子分类已移除，请点击下方「保存配置」使变更生效。');
  };

  // 上移规则
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const nextRules = [...currentRules];
    const temp = nextRules[index];
    nextRules[index] = nextRules[index - 1];
    nextRules[index - 1] = temp;
    setConfig({
      ...config,
      [selectedCat]: nextRules,
    });
  };

  // 下移规则
  const handleMoveDown = (index: number) => {
    if (index >= currentRules.length - 1) return;
    const nextRules = [...currentRules];
    const temp = nextRules[index];
    nextRules[index] = nextRules[index + 1];
    nextRules[index + 1] = temp;
    setConfig({
      ...config,
      [selectedCat]: nextRules,
    });
  };

  // 打开添加模态框
  const handleOpenAddModal = () => {
    setEditingIndex(null);
    form.resetFields();
    form.setFieldsValue({
      matchType: 'regex',
      key: '',
      label: '',
      pattern: '',
    });
    setModalOpen(true);
  };

  // 打开编辑模态框
  const handleOpenEditModal = (record: RawSubCategoryConfig, index: number) => {
    setEditingIndex(index);
    form.resetFields();
    form.setFieldsValue({
      key: record.key,
      label: record.label,
      matchType: record.matchType || 'all',
      pattern: record.pattern || '',
    });
    setModalOpen(true);
  };

  // 保存添加/编辑
  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();
      const newRule: RawSubCategoryConfig = {
        key: String(values.key).trim().toLowerCase(),
        label: String(values.label).trim(),
        matchType: values.matchType || 'all',
        pattern: values.matchType !== 'all' ? String(values.pattern || '').trim() : undefined,
      };

      const nextRules = [...currentRules];
      if (editingIndex !== null && editingIndex >= 0) {
        nextRules[editingIndex] = newRule;
      } else {
        // 检查 key 是否重复
        if (nextRules.some((r) => r.key === newRule.key)) {
          message.warning(`标识键 "${newRule.key}" 已存在，请更换！`);
          return;
        }
        nextRules.push(newRule);
      }

      const nextConfig = {
        ...config,
        [selectedCat]: nextRules,
      };
      setConfig(nextConfig);
      setModalOpen(false);
      message.success(editingIndex !== null ? '子分类规则修改成功' : '新增子分类成功');
    } catch (e) {
      // form validate failed
    }
  };

  // JSON 编辑改变
  const handleJsonChange = (val: string) => {
    setJsonText(val);
    try {
      const parsed = JSON.parse(val);
      if (parsed && typeof parsed === 'object') {
        setJsonError(null);
        setConfig(parsed);
      } else {
        setJsonError('必须是合法 JSON 字典对象');
      }
    } catch (err: any) {
      setJsonError(`JSON 语法解析错误: ${err.message}`);
    }
  };

  // 格式化 JSON
  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      const formatted = JSON.stringify(parsed, null, 2);
      setJsonText(formatted);
      setJsonError(null);
      message.success('JSON 格式化成功');
    } catch (e: any) {
      message.error('无法格式化: ' + e.message);
    }
  };

  // 为当前图库克隆/定制规则
  const handleCloneFromUniversal = () => {
    const universalRules = config['universal'] || (subCategoriesPreset as any).universal || [];
    const nextConfig = {
      ...config,
      [selectedCat]: JSON.parse(JSON.stringify(universalRules)),
    };
    setConfig(nextConfig);
    message.success(`已从通用图库规则克隆至 [${selectedCat}]，可直接进行二次调整`);
  };

  // 表格列定义
  const columns = [
    {
      title: '排序',
      key: 'sort',
      width: 80,
      render: (_: any, __: any, index: number) => (
        <Space size={2}>
          <Button
            type="text"
            size="small"
            icon={<ArrowUpOutlined />}
            disabled={index === 0}
            onClick={() => handleMoveUp(index)}
            title="上移"
          />
          <Button
            type="text"
            size="small"
            icon={<ArrowDownOutlined />}
            disabled={index === currentRules.length - 1}
            onClick={() => handleMoveDown(index)}
            title="下移"
          />
        </Space>
      ),
    },
    {
      title: '标识 Key',
      dataIndex: 'key',
      key: 'key',
      width: 130,
      render: (key: string) => (
        <Text code strong style={{ color: key === 'all' ? '#1890ff' : undefined }}>
          {key}
        </Text>
      ),
    },
    {
      title: '展示名称 (Label)',
      dataIndex: 'label',
      key: 'label',
      width: 140,
      render: (label: string, record: RawSubCategoryConfig) => (
        <Space>
          <span style={{ fontWeight: 500 }}>{label}</span>
          {record.key === 'all' && <Tag color="blue">全局默认</Tag>}
        </Space>
      ),
    },
    {
      title: '匹配方式',
      dataIndex: 'matchType',
      key: 'matchType',
      width: 130,
      render: (matchType: string) => {
        if (!matchType || matchType === 'all') return <Tag color="default">全部命中</Tag>;
        if (matchType === 'regex') return <Tag color="purple">正则表达式</Tag>;
        if (matchType === 'endsWith') return <Tag color="cyan">以指定后缀结尾</Tag>;
        if (matchType === 'notEndsWith') return <Tag color="orange">不以指定后缀结尾</Tag>;
        return <Tag>{matchType}</Tag>;
      },
    },
    {
      title: '匹配规则表达式 (Pattern)',
      dataIndex: 'pattern',
      key: 'pattern',
      render: (pattern: string, record: RawSubCategoryConfig) => {
        if (!record.matchType || record.matchType === 'all') {
          return <Text type="secondary">— 全部图标默认通过 —</Text>;
        }
        return (
          <Tooltip title={pattern} placement="topLeft">
            <Text
              code
              style={{
                maxWidth: 280,
                display: 'inline-block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {pattern}
            </Text>
          </Tooltip>
        );
      },
    },
    {
      title: '当前图库命中预览',
      key: 'preview',
      width: 160,
      render: (_: any, __: any, index: number) => {
        const stat = ruleMatchStats[index];
        if (selectedCat === 'builtin') {
          return <Text type="secondary">系统内置图标库</Text>;
        }
        if (currentCategoryIcons.length === 0) {
          return <Text type="secondary">暂无该库图标</Text>;
        }
        if (stat?.error) {
          return <Tag color="error">{stat.error}</Tag>;
        }
        return (
          <Badge
            count={stat?.count || 0}
            overflowCount={99999}
            style={{
              backgroundColor: (stat?.count || 0) > 0 ? '#52c41a' : '#d9d9d9',
              fontSize: 12,
              padding: '0 8px',
            }}
          />
        );
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      align: 'right' as const,
      render: (record: RawSubCategoryConfig, _: any, index: number) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleOpenEditModal(record, index)}
          >
            编辑
          </Button>
          {record.key !== 'all' && (
            <Popconfirm
              title={`确定删除子分类 [${record.label}] 吗？`}
              okText="删除"
              cancelText="取消"
              onConfirm={() => handleDeleteRule(index)}
            >
              <Button type="link" danger size="small" icon={<DeleteOutlined />}>
                删除
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="sub-categories-settings-panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Alert
        message="子分类动态规则体系说明"
        description="系统采用灵活的规则引擎将图标库动态划分为多个专属子分类（如常用办公、方向交互、设备硬件等）。图标选择器打开时会根据当前选中的图库大类，自动匹配并即时渲染对应的分类 Tab。"
        type="info"
        showIcon
        closable
      />

      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <Space size="middle">
              <span style={{ fontSize: 14, fontWeight: 600 }}>🏷️ 选择配置图库：</span>
              <Select
                value={selectedCat}
                onChange={setSelectedCat}
                options={categoryOptions}
                style={{ width: 260 }}
                showSearch
                filterOption={(input, option) =>
                  String(option?.label || '').toLowerCase().includes(input.toLowerCase())
                }
              />
              {!config[selectedCat] && (
                <Tag color="orange">当前继承通用规则 (universal)</Tag>
              )}
            </Space>

            <Space>
              <Radio.Group
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                optionType="button"
                buttonStyle="solid"
                size="small"
              >
                <Radio.Button value="table">
                  <TableOutlined /> 表格可视化
                </Radio.Button>
                <Radio.Button value="json">
                  <CodeOutlined /> JSON 源码
                </Radio.Button>
              </Radio.Group>
            </Space>
          </div>
        }
        extra={
          mode === 'table' ? (
            <Space>
              {!config[selectedCat] && (
                <Button icon={<CopyOutlined />} size="small" onClick={handleCloneFromUniversal}>
                  为此图库单独定制规则
                </Button>
              )}
              <Button type="primary" icon={<PlusOutlined />} size="small" onClick={handleOpenAddModal}>
                添加子分类
              </Button>
            </Space>
          ) : (
            <Space>
              <Button icon={<FormatPainterOutlined />} size="small" onClick={handleFormatJson}>
                格式化 JSON
              </Button>
            </Space>
          )
        }
      >
        {mode === 'table' ? (
          <div>
            <Table
              columns={columns}
              dataSource={currentRules.map((item, idx) => ({ ...item, _index: idx }))}
              rowKey={(r, idx) => `${r.key}_${idx}`}
              pagination={false}
              size="middle"
              bordered
            />

            <div
              style={{
                marginTop: 20,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <Space>
                <Popconfirm
                  title={`确定将 [${selectedCat}] 图库恢复为官方初始预设规则吗？`}
                  onConfirm={handleResetCurrentCat}
                  okText="确定恢复"
                  cancelText="取消"
                >
                  <Button icon={<UndoOutlined />}>恢复当前图库预设</Button>
                </Popconfirm>

                <Popconfirm
                  title="确定将所有大类的分类规则全部恢复为系统初始安装状态吗？"
                  onConfirm={handleResetAll}
                  okText="全部重置"
                  cancelText="取消"
                >
                  <Button danger icon={<UndoOutlined />}>
                    重置所有图库至出厂预设
                  </Button>
                </Popconfirm>
              </Space>

              <Button
                type="primary"
                icon={<CheckOutlined />}
                loading={saving}
                size="large"
                style={{ minWidth: 160 }}
                onClick={() => handleSave()}
              >
                保存配置并立即生效
              </Button>
            </div>
          </div>
        ) : (
          <div>
            {jsonError && (
              <Alert
                message={jsonError}
                type="error"
                showIcon
                style={{ marginBottom: 12 }}
              />
            )}
            <TextArea
              rows={22}
              value={jsonText}
              onChange={(e) => handleJsonChange(e.target.value)}
              style={{
                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                fontSize: 13,
                lineHeight: 1.5,
              }}
            />
            <div
              style={{
                marginTop: 16,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text type="secondary">
                💡 提示：在此处可直接复制备份或粘贴 JSON 规则字典，保存后将即时同步至服务端。
              </Text>
              <Space>
                <Button icon={<UndoOutlined />} onClick={handleResetAll}>
                  恢复出厂默认
                </Button>
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  loading={saving}
                  disabled={Boolean(jsonError)}
                  onClick={() => handleSave()}
                >
                  保存 JSON 配置并生效
                </Button>
              </Space>
            </div>
          </div>
        )}
      </Card>

      {/* 规则添加 / 编辑弹窗 */}
      <Modal
        open={modalOpen}
        title={editingIndex !== null ? '✏️ 编辑子分类规则' : '➕ 添加子分类规则'}
        okText="确定"
        cancelText="取消"
        onCancel={() => setModalOpen(false)}
        onOk={handleModalSubmit}
        destroyOnClose
        width={540}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            label="分类英文标识 Key"
            name="key"
            rules={[
              { required: true, message: '请输入分类标识 Key' },
              { pattern: /^[a-zA-Z0-9_-]+$/, message: '仅支持字母、数字、下划线及连字符' },
            ]}
            extra="如 office、devices、arrows 等（全小写英文，作为唯一检索键）"
          >
            <Input placeholder="例如: office" disabled={editingIndex !== null && currentRules[editingIndex]?.key === 'all'} />
          </Form.Item>

          <Form.Item
            label="展示名称 Label"
            name="label"
            rules={[{ required: true, message: '请输入在图标选择器中展示的中文标签' }]}
            extra="如「常用办公」、「电子设备」、「方向指示」等"
          >
            <Input placeholder="例如: 常用办公" />
          </Form.Item>

          <Form.Item label="匹配模式 Match Type" name="matchType" rules={[{ required: true }]}>
            <Radio.Group>
              <Radio value="all">全部通过 (all)</Radio>
              <Radio value="regex">正则表达式 (regex)</Radio>
              <Radio value="endsWith">特定后缀结尾 (endsWith)</Radio>
              <Radio value="notEndsWith">非特定后缀 (notEndsWith)</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prev, curr) => prev.matchType !== curr.matchType}
          >
            {({ getFieldValue }) => {
              const matchType = getFieldValue('matchType');
              if (!matchType || matchType === 'all') return null;

              return (
                <Form.Item
                  label={
                    matchType === 'regex'
                      ? '正则表达式 Pattern (不区分大小写)'
                      : '匹配特征字符串 Pattern'
                  }
                  name="pattern"
                  rules={[{ required: true, message: '请输入匹配特征字符串或正则表达式' }]}
                  extra={
                    matchType === 'regex'
                      ? '示例: doc|file|folder|pen|edit|save 将匹配名称中包含上述任意词汇的图标'
                      : '示例: -l 将匹配名称以 -l 结尾的图标（如草莓线框图标）'
                  }
                >
                  <Input
                    placeholder={
                      matchType === 'regex'
                        ? '例如: doc|file|folder|pen|edit|save'
                        : '例如: -l'
                    }
                  />
                </Form.Item>
              );
            }}
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
