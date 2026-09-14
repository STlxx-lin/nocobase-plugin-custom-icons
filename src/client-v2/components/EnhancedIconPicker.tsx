import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  CloseOutlined,
  LoadingOutlined,
  PlusOutlined,
  DeleteOutlined,
  BgColorsOutlined,
  FontSizeOutlined,
  UndoOutlined,
} from '@ant-design/icons';
function getFormilyBindings() {
  let fr: any = null;
  let fs: any = null;
  let antdV5: any = null;
  if (typeof window !== 'undefined') {
    const w = window as any;
    fr =
      w.__nocobase_app_dev_deps__?.['@formily/react'] ||
      w.requirejs?.requirejs?.s?.contexts?._?.defined?.['@formily/react'] ||
      w.requirejs?.s?.contexts?._?.defined?.['@formily/react'];
    fs =
      w.__nocobase_app_dev_deps__?.['@formily/shared'] ||
      w.requirejs?.requirejs?.s?.contexts?._?.defined?.['@formily/shared'] ||
      w.requirejs?.s?.contexts?._?.defined?.['@formily/shared'];
    antdV5 =
      w.__nocobase_app_dev_deps__?.['@formily/antd-v5'] ||
      w.requirejs?.requirejs?.s?.contexts?._?.defined?.['@formily/antd-v5'] ||
      w.requirejs?.s?.contexts?._?.defined?.['@formily/antd-v5'];
  }
  return { fr, fs, antdV5 };
}

function safeUseFormLayout(): any {
  const { antdV5 } = getFormilyBindings();
  if (typeof antdV5?.useFormLayout === 'function') {
    try {
      return antdV5.useFormLayout();
    } catch (e) {}
  }
  return {};
}
import {
  Button,
  Empty,
  Flex,
  Input,
  Radio,
  Select,
  Space,
  theme,
  Popover,
  Tooltip,
  Popconfirm,
  Badge,
  Pagination,
} from 'antd';
import { debounce, groupBy } from 'lodash';
import { useTranslation } from 'react-i18next';
import {
  customIconsManager,
  CustomIconItem,
  SubCategoryDef,
  RawSubCategoryConfig,
  parseSubCategoryRules,
  safeHasIcon as hasIcon,
  SafeIcon as Icon,
  getSafeIconsMap,
  antdIconsDict,
} from '../services/custom-icons-manager';
import { CustomIconModal } from './CustomIconModal';
import {
  parseIconValue,
  formatIconValue,
  PRESET_ICON_COLORS,
  PRESET_ICON_SIZES,
} from '../utils/icon-style-helper';

const { Search } = Input;

export interface IconPickerProps {
  value?: string;
  onChange?: (value: string | null) => void;
  disabled?: boolean;
  suffix?: React.ReactNode;
  iconSize?: number;
  searchable?: boolean;
  onChangeComplete?: (value: string | null) => void;
  apiClient?: any;
  popoverWidth?: string;
}

interface IconPickerReadPrettyProps {
  value?: string;
}

const groupByIconName = (data: string[]) => {
  return groupBy(data, (str) => {
    if (str.endsWith('outlined')) return 'Outlined';
    if (str.endsWith('filled')) return 'Filled';
    if (str.endsWith('twotone')) return 'TwoTone';
    return 'Other';
  });
};

/**
 * 统一渲染带样式图标预览组件
 * 全面支持 Ant Design Outlined / Filled / TwoTone 双色图标以及自定义 SVG 图标
 */
export const RenderPreviewIcon: React.FC<{
  name: string;
  color?: string;
  size?: string;
  style?: React.CSSProperties;
}> = ({ name, color, size, style }) => {
  if (!name) return null;
  const isTwoTone = name.toLowerCase().endsWith('twotone');

  const normalizedSize = size
    ? (size.endsWith('px') || size.endsWith('em') || size.endsWith('rem') ? size : `${size}px`)
    : undefined;

  const extraProps: any = {};
  if (color && isTwoTone) {
    extraProps.twoToneColor = color;
  }

  return (
    <span
      className={`enhanced-preview-icon ${isTwoTone ? 'is-twotone' : ''}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        lineHeight: 1,
        verticalAlign: '-0.125em',
        color: color || undefined,
        fontSize: normalizedSize,
        width: normalizedSize || undefined,
        height: normalizedSize || undefined,
        transition: 'all 0.2s ease',
        ...style,
      }}
    >
      <Icon
        type={name}
        {...extraProps}
        style={{
          fontSize: normalizedSize || 'inherit',
          color: color || 'inherit',
          width: normalizedSize || undefined,
          height: normalizedSize || undefined,
        }}
      />
    </span>
  );
};

export type { SubCategoryDef, RawSubCategoryConfig };
export const parseSubCategories = parseSubCategoryRules;

export const CAOMEI_SUB_CATEGORIES: SubCategoryDef[] = customIconsManager.getSubCategories('caomei');
export const BUILTIN_SUB_CATEGORIES: SubCategoryDef[] = customIconsManager.getSubCategories('builtin');
export const UNIVERSAL_ICONIFY_SUB_CATEGORIES: SubCategoryDef[] = customIconsManager.getSubCategories('universal');

function EnhancedIconField(props: IconPickerProps) {
  const { fontSizeXL } = theme.useToken().token;
  const layout = safeUseFormLayout();
  const {
    value,
    onChange,
    disabled,
    iconSize = fontSizeXL,
    searchable = true,
    onChangeComplete,
    apiClient,
  } = props;

  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [activeTab, setActiveTab] = useState('Outlined');
  const [activeSubCat, setActiveSubCat] = useState('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [tick, setTick] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 动态读取全局分页配置（支持设置中心动态调整即时生效）
  const paginationConfig = customIconsManager.getPaginationConfig();
  const { enablePagination = true, threshold = 500, pageSize = 200 } = paginationConfig;

  // 当切换大分类或子分类或搜索时，重置分页为第 1 页
  useEffect(() => {
    setActiveSubCat('all');
    setCurrentPage(1);
  }, [activeTab]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeSubCat, searchVal]);

  // 翻页时网格容器自动平滑置顶
  useEffect(() => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  // 内部状态同步以保证零延迟即时视觉反馈
  const [internalValue, setInternalValue] = useState<string | null | undefined>(value);
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const effectiveValue = value !== undefined ? value : internalValue;

  // 解析当前图标名称与样式参数
  const { name: currentBaseName, color: currentColor, size: currentSize } = useMemo(
    () => parseIconValue(effectiveValue),
    [effectiveValue],
  );

  // 如果当前带有复合样式，确保全局引擎预先注册该复合组件
  useEffect(() => {
    if (effectiveValue && effectiveValue.includes('?')) {
      customIconsManager.registerStyledIcon(effectiveValue);
    }
  }, [effectiveValue]);

  // 监听自定义图标管理器的变更
  useEffect(() => {
    const unsub = customIconsManager.subscribe(() => {
      setTick((prev) => prev + 1);
    });
    return unsub;
  }, []);

  // 内置 Antd 图标列表（安全防空回退）
  const builtInIcons = useMemo(() => {
    const iconsMap = getSafeIconsMap();
    if (iconsMap && typeof iconsMap.keys === 'function') {
      const keys = [...iconsMap.keys()].filter((name) => {
        return (
          typeof name === 'string' &&
          !name.includes('?') &&
          (name.endsWith('outlined') || name.endsWith('filled') || name.endsWith('twotone'))
        );
      });
      if (keys.length > 0) return keys;
    }
    return Array.from(antdIconsDict.keys()).filter((name) => {
      return (
        typeof name === 'string' &&
        !name.includes('?') &&
        (name.endsWith('outlined') || name.endsWith('filled') || name.endsWith('twotone'))
      );
    });
  }, [tick]);

  const groupIconData = useMemo(() => groupByIconName(builtInIcons), [builtInIcons]);

  // 自定义图标数据
  const allCustomIcons = customIconsManager.getAllIcons();
  const customCategories = customIconsManager.getCategories();

  // 过滤后的内置图标
  const filteredBuiltInIcons = useMemo(() => {
    const q = searchVal.trim().toLowerCase();
    if (!q) return builtInIcons;
    return builtInIcons.filter((i) => i.toLowerCase().includes(q));
  }, [builtInIcons, searchVal]);

  // 过滤后的自定义图标
  const filteredCustomIcons = useMemo(() => {
    const q = searchVal.trim().toLowerCase();
    if (!q) return allCustomIcons;
    return allCustomIcons.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.title && item.title.toLowerCase().includes(q)),
    );
  }, [allCustomIcons, searchVal]);

  const handleSearch = debounce((text: string) => {
    setSearchVal(text || '');
  }, 200);

  const style: React.CSSProperties = {
    width: '28em',
    height: '22em',
    overflowY: 'auto',
    padding: '4px 0',
  };

  // 分类下拉分组选项（采用下拉分组，彻底消除长条按钮堆叠）
  const categorySelectOptions = useMemo(() => {
    const groups: any[] = [
      {
        label: '官方内置图标',
        options: [
          { label: '线框风格 (Outlined)', value: 'Outlined' },
          { label: '实底风格 (Filled)', value: 'Filled' },
          { label: '双色风格 (TwoTone)', value: 'TwoTone' },
        ],
      },
    ];

    if (customCategories.length > 0) {
      const labelMap: Record<string, string> = {
        caomei: '草莓图标库 (caomei)',
        lucide: 'Lucide 精工图标库 (lucide)',
        streamline: 'Streamline 核心图库 (streamline)',
        'streamline-logos': 'Streamline 知名品牌 (streamline-logos)',
        'streamline-emojis': 'Streamline 高清表情 (streamline-emojis)',
        ri: 'Remix Icon (ri)',
        tabler: 'Tabler 图标库 (tabler)',
        'simple-icons': 'Simple Icons 品牌 (simple-icons)',
        solar: 'Solar 现代图标库 (solar)',
        custom: t('Custom') || '自定义',
      };
      groups.push({
        label: '扩展与外部图库',
        options: customCategories.map((c) => ({
          label: labelMap[c] || c,
          value: `custom:${c}`,
        })),
      });
    }

    return groups;
  }, [customCategories, t]);

  // 计算当前分类对应的子分类项列表（带数量统计，动态支持设置中心配置）
  const currentSubCategories = useMemo(() => {
    // 1. 所有扩展与外部图库（如 草莓、Lucide、Remix、Tabler、Solar 等）
    if (activeTab.startsWith('custom:')) {
      const targetCat = activeTab.replace('custom:', '');
      const subDefs = customIconsManager.getSubCategories(targetCat);
      const iconsInCat = allCustomIcons.filter((i) => (i.category || 'custom') === targetCat);
      return subDefs
        .map((sub) => {
          const count = iconsInCat.filter((item) => sub.filter(item.name, item)).length;
          return { ...sub, count };
        })
        .filter((s) => s.key === 'all' || s.count > 0);
    }

    // 2. 系统官方内置图标（线框 / 实底 / 双色）
    const subDefs = customIconsManager.getSubCategories(activeTab);
    const list = groupIconData[activeTab] || [];
    return subDefs
      .map((sub) => {
        const count = list.filter((key) => sub.filter(key)).length;
        return { ...sub, count };
      })
      .filter((s) => s.key === 'all' || s.count > 0);
  }, [activeTab, allCustomIcons, groupIconData, tick]);

  // 选中图标并保留当前已配置的颜色与尺寸
  const handleSelectIcon = (key: string) => {
    const nextVal = formatIconValue(key, currentColor, currentSize);
    if (nextVal && nextVal.includes('?')) {
      customIconsManager.registerStyledIcon(nextVal);
    }
    setInternalValue(nextVal);
    onChange?.(nextVal);
    onChangeComplete?.(nextVal);
    setVisible(false);
  };

  // 变更颜色
  const handleColorChange = (newColor: string | undefined) => {
    if (!currentBaseName) return;
    const nextVal = formatIconValue(currentBaseName, newColor, currentSize);
    if (nextVal && nextVal.includes('?')) {
      customIconsManager.registerStyledIcon(nextVal);
    }
    setInternalValue(nextVal);
    onChange?.(nextVal);
    onChangeComplete?.(nextVal);
  };

  // 变更大小
  const handleSizeChange = (newSize: string | undefined) => {
    if (!currentBaseName) return;
    const nextVal = formatIconValue(currentBaseName, currentColor, newSize);
    if (nextVal && nextVal.includes('?')) {
      customIconsManager.registerStyledIcon(nextVal);
    }
    setInternalValue(nextVal);
    onChange?.(nextVal);
    onChangeComplete?.(nextVal);
  };

  const handleDeleteCustomIcon = async (e: React.MouseEvent, item: CustomIconItem) => {
    e.stopPropagation();
    try {
      await customIconsManager.deleteIcon({ id: item.id, name: item.name }, apiClient);
      if (currentBaseName === item.name) {
        onChange?.(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 渲染图标网格内容（超过 500 款自动启用分页）
  const renderContent = () => {
    // 搜索有关键词时的综合展示
    if (searchVal.trim()) {
      const matchBuiltIn = filteredBuiltInIcons;
      const matchCustom = filteredCustomIcons;

      if (matchBuiltIn.length === 0 && matchCustom.length === 0) {
        return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="未找到匹配的图标" />;
      }

      const totalCustom = matchCustom.length;
      const needCustomPaging = enablePagination && (threshold === 0 || totalCustom > threshold);
      const displayCustom = needCustomPaging
        ? matchCustom.slice((currentPage - 1) * pageSize, currentPage * pageSize)
        : matchCustom;

      return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div ref={scrollContainerRef} style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
            <Flex vertical gap="middle">
              {matchCustom.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#1677ff', marginBottom: 6 }}>
                    自定义与外部图标库 ({matchCustom.length})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {displayCustom.map((item) => (
                      <Tooltip key={item.name} title={`${item.title || item.name} (${item.name})`}>
                        <span
                          style={{
                            fontSize: iconSize,
                            padding: '4px 6px',
                            cursor: 'pointer',
                            borderRadius: 4,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: currentBaseName === item.name ? '#e6f4ff' : 'transparent',
                            border: currentBaseName === item.name ? '1px solid #1677ff' : '1px solid transparent',
                          }}
                          onClick={() => handleSelectIcon(item.name)}
                        >
                          <Icon type={item.name} />
                        </span>
                      </Tooltip>
                    ))}
                  </div>
                </div>
              )}

              {matchBuiltIn.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#8c8c8c', marginBottom: 6 }}>
                    系统内置图标 ({matchBuiltIn.length})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {matchBuiltIn.slice(0, 150).map((key) => (
                      <span
                        key={key}
                        title={key.replace(/outlined|filled|twotone$/i, '')}
                        style={{
                          fontSize: iconSize,
                          padding: '4px 6px',
                          cursor: 'pointer',
                          borderRadius: 4,
                          display: 'inline-flex',
                          backgroundColor: currentBaseName === key ? '#e6f4ff' : 'transparent',
                        }}
                        onClick={() => handleSelectIcon(key)}
                      >
                        <Icon type={key} />
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Flex>
          </div>

          {needCustomPaging && (
            <div
              style={{
                flexShrink: 0,
                padding: '6px 4px 2px',
                borderTop: '1px solid #f0f0f0',
                backgroundColor: '#fafafa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: 11, color: '#8c8c8c' }}>
                共 {totalCustom} 款 · 每页 {pageSize} 款
              </span>
              <Pagination
                size="small"
                simple
                current={currentPage}
                pageSize={pageSize}
                total={totalCustom}
                onChange={(p) => setCurrentPage(p)}
              />
            </div>
          )}
        </div>
      );
    }

    // 默认按分类选项卡展示
    const isCustomCat = activeTab.startsWith('custom:');

    if (isCustomCat) {
      const targetCat = activeTab.replace('custom:', '');
      let iconsInCat = allCustomIcons.filter((i) => (i.category || 'custom') === targetCat);

      // 如果选中了特定子分类
      if (activeSubCat !== 'all') {
        const subDef =
          activeTab === 'custom:caomei'
            ? CAOMEI_SUB_CATEGORIES.find((s) => s.key === activeSubCat)
            : UNIVERSAL_ICONIFY_SUB_CATEGORIES.find((s) => s.key === activeSubCat);
        if (subDef) {
          iconsInCat = iconsInCat.filter((item) => subDef.filter(item.name, item));
        }
      }

      if (iconsInCat.length === 0) {
        return (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              activeSubCat !== 'all' ? (
                <span>
                  该子分类下暂无图标，<a onClick={() => setActiveSubCat('all')}>查看全部</a>
                </span>
              ) : (
                <span>
                  该分类下暂无图标，
                  <a onClick={() => setModalOpen(true)}>立即添加 SVG</a>
                </span>
              )
            }
          />
        );
      }

      const totalCount = iconsInCat.length;
      const needPagination = enablePagination && (threshold === 0 || totalCount > threshold);
      const displayIcons = needPagination
        ? iconsInCat.slice((currentPage - 1) * pageSize, currentPage * pageSize)
        : iconsInCat;

      return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div ref={scrollContainerRef} style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {displayIcons.map((item) => (
                <Tooltip key={item.name} title={`${item.title || item.name} (${item.name})`}>
                  <span
                    style={{
                      fontSize: iconSize,
                      padding: '4px 6px',
                      cursor: 'pointer',
                      borderRadius: 4,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: currentBaseName === item.name ? '#e6f4ff' : 'transparent',
                      border: currentBaseName === item.name ? '1px solid #1677ff' : '1px solid transparent',
                      position: 'relative',
                    }}
                    onClick={() => handleSelectIcon(item.name)}
                  >
                    <Icon type={item.name} />
                  </span>
                </Tooltip>
              ))}
            </div>
          </div>

          {needPagination && (
            <div
              style={{
                flexShrink: 0,
                padding: '6px 4px 2px',
                borderTop: '1px solid #f0f0f0',
                backgroundColor: '#fafafa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: 11, color: '#8c8c8c' }}>
                共 {totalCount} 款 · 每页 {pageSize} 款
              </span>
              <Pagination
                size="small"
                simple
                current={currentPage}
                pageSize={pageSize}
                total={totalCount}
                onChange={(p) => setCurrentPage(p)}
              />
            </div>
          )}
        </div>
      );
    }

    // 系统内置样式标签
    let currentList = groupIconData[activeTab] || [];
    if (activeSubCat !== 'all') {
      const subDef = BUILTIN_SUB_CATEGORIES.find((s) => s.key === activeSubCat);
      if (subDef) {
        currentList = currentList.filter((key) => subDef.filter(key));
      }
    }

    if (currentList.length === 0) {
      return (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <span>
              该分类下暂无匹配图标，<a onClick={() => setActiveSubCat('all')}>查看全部</a>
            </span>
          }
        />
      );
    }

    const totalBuiltIn = currentList.length;
    const needBuiltInPaging = enablePagination && (threshold === 0 || totalBuiltIn > threshold);
    const displayBuiltIn = needBuiltInPaging
      ? currentList.slice((currentPage - 1) * pageSize, currentPage * pageSize)
      : currentList;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div ref={scrollContainerRef} style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {displayBuiltIn.map((key) => (
              <span
                key={key}
                title={key.replace(/outlined|filled|twotone$/i, '')}
                style={{
                  fontSize: iconSize,
                  padding: '4px 6px',
                  cursor: 'pointer',
                  borderRadius: 4,
                  display: 'inline-flex',
                  backgroundColor: currentBaseName === key ? '#e6f4ff' : 'transparent',
                }}
                onClick={() => handleSelectIcon(key)}
              >
                <Icon type={key} />
              </span>
            ))}
          </div>
        </div>

        {needBuiltInPaging && (
          <div
            style={{
              flexShrink: 0,
              padding: '6px 4px 2px',
              borderTop: '1px solid #f0f0f0',
              backgroundColor: '#fafafa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: 11, color: '#8c8c8c' }}>
              共 {totalBuiltIn} 款 · 每页 {pageSize} 款
            </span>
            <Pagination
              size="small"
              simple
              current={currentPage}
              pageSize={pageSize}
              total={totalBuiltIn}
              onChange={(p) => setCurrentPage(p)}
            />
          </div>
        )}
      </div>
    );
  };

  const showSubSidebar = currentSubCategories.length > 1 && !searchVal.trim();
  const effectiveWidthConfig = props.popoverWidth || paginationConfig.popoverWidth || 'wide';

  let resolvedWidth: string = showSubSidebar ? '44em' : '36em';
  if (effectiveWidthConfig === 'adaptive') {
    resolvedWidth = showSubSidebar ? 'clamp(35em, 52vw, 54em)' : 'clamp(28em, 42vw, 46em)';
  } else if (effectiveWidthConfig === 'standard') {
    resolvedWidth = showSubSidebar ? '35em' : '28em';
  } else if (effectiveWidthConfig === 'wide') {
    resolvedWidth = showSubSidebar ? '44em' : '36em';
  } else if (effectiveWidthConfig === 'extra-wide') {
    resolvedWidth = showSubSidebar ? '54em' : '44em';
  } else if (effectiveWidthConfig === 'compact') {
    resolvedWidth = showSubSidebar ? '30em' : '24em';
  } else if (effectiveWidthConfig) {
    resolvedWidth = effectiveWidthConfig;
  }

  const containerStyle: React.CSSProperties = {
    width: resolvedWidth,
    maxWidth: 'calc(100vw - 24px)',
    height: '22em',
    display: 'flex',
    overflow: 'hidden',
  };

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center' }}>
      {/* 紧凑一体化按钮组：边框贴合、视觉统一、毫无散落冗余感 */}
      <Space.Compact style={{ display: 'inline-flex', verticalAlign: 'middle' }}>
        {/* 1. 图标主触发按钮 */}
        <Popover
          placement="bottomLeft"
          open={visible}
          overlayStyle={{ maxWidth: 'calc(100vw - 24px)' }}
          onOpenChange={(val) => {
            if (disabled) return;
            setVisible(val);
          }}
          trigger="click"
          title={
            <div style={{ padding: '2px 0 6px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* 精致紧凑工具栏：将原本分散的标题、搜索与一长串分类按钮浓缩为一行 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {searchable && (
                  <Search
                    placeholder="搜索图标名称或标识..."
                    allowClear
                    size="middle"
                    style={{ flex: 1, height: 32, minWidth: 120 }}
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                )}
                {!searchVal.trim() && (
                  <Select
                    size="middle"
                    value={activeTab}
                    onChange={(val) => setActiveTab(val)}
                    options={categorySelectOptions}
                    style={{ width: 190, height: 32, flexShrink: 0 }}
                    popupMatchSelectWidth={false}
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
                  />
                )}
                <Tooltip title="自定义输入 SVG 或批量导入图标库">
                  <Button
                    type="dashed"
                    size="middle"
                    icon={<PlusOutlined />}
                    style={{ height: 32, flexShrink: 0 }}
                    onClick={() => setModalOpen(true)}
                  >
                    导入
                  </Button>
                </Tooltip>
              </div>
            </div>
          }
          content={
            <div style={containerStyle}>
              {/* 左侧：图标网格展示与独立纵向滚动（支持底部吸底分页） */}
              <div
                style={{
                  flex: 1,
                  height: '100%',
                  overflow: 'hidden',
                  padding: '4px 6px 4px 0',
                }}
              >
                {renderContent()}
              </div>

              {/* 右侧：子分类导航栏（填充原本空白区域） */}
              {showSubSidebar && (
                <div
                  style={{
                    width: 96,
                    height: '100%',
                    overflowY: 'auto',
                    borderLeft: '1px solid #f0f0f0',
                    padding: '2px 0 2px 6px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: '#8c8c8c',
                      padding: '2px 4px 4px',
                      fontWeight: 600,
                      borderBottom: '1px dashed #f0f0f0',
                      marginBottom: 2,
                    }}
                  >
                    子分类
                  </div>
                  {currentSubCategories.map((sub) => {
                    const isActive = activeSubCat === sub.key;
                    return (
                      <div
                        key={sub.key}
                        onClick={() => setActiveSubCat(sub.key)}
                        style={{
                          padding: '4px 6px',
                          borderRadius: 4,
                          fontSize: 12,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          backgroundColor: isActive ? '#e6f4ff' : 'transparent',
                          color: isActive ? '#1677ff' : '#595959',
                          fontWeight: isActive ? 600 : 400,
                          transition: 'all 0.15s ease',
                          userSelect: 'none',
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) e.currentTarget.style.backgroundColor = '#f5f5f5';
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {sub.label}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            color: isActive ? '#1677ff' : '#bfbfbf',
                            transform: 'scale(0.88)',
                          }}
                        >
                          {sub.count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          }
        >
          <Button
            size={layout.size as any}
            disabled={disabled}
            style={{
              minWidth: 130,
              textAlign: 'left',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            {currentBaseName ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <RenderPreviewIcon
                  name={currentBaseName}
                  color={currentColor}
                  size={currentSize}
                />
                <span style={{ fontSize: 12, color: '#595959', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentBaseName}
                </span>
              </span>
            ) : (
              <span style={{ color: '#8c8c8c' }}>{t('Select icon') || '选择图标'}</span>
            )}
          </Button>
        </Popover>

        {/* 2. 颜色配置按钮（内嵌在紧凑按钮组中） */}
        <Popover
          trigger="click"
          placement="bottom"
          title={<div style={{ fontWeight: 600, fontSize: 13 }}>配置图标颜色</div>}
          content={
            <div style={{ width: 220, padding: 4 }}>
              <div style={{ marginBottom: 8, fontSize: 12, color: '#8c8c8c' }}>预设主题色：</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, marginBottom: 12 }}>
                {PRESET_ICON_COLORS.map((c) => (
                  <Tooltip title={c.label} key={c.value}>
                    <div
                      onClick={() => handleColorChange(c.value)}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 4,
                        backgroundColor: c.value,
                        cursor: 'pointer',
                        border: currentColor === c.value ? '2px solid #000' : '1px solid #d9d9d9',
                        boxShadow: currentColor === c.value ? '0 0 0 2px rgba(22, 119, 255, 0.4)' : undefined,
                        transition: 'all 0.15s',
                      }}
                    />
                  </Tooltip>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 12 }}>自定义:</span>
                <input
                  type="color"
                  value={currentColor || '#1677ff'}
                  onChange={(e) => handleColorChange(e.target.value)}
                  style={{ width: 32, height: 26, padding: 0, border: 'none', cursor: 'pointer', background: 'none' }}
                />
                <Input
                  size="small"
                  style={{ width: 100, fontSize: 12 }}
                  value={currentColor || ''}
                  placeholder="#1677ff"
                  onChange={(e) => handleColorChange(e.target.value)}
                />
              </div>
              {currentColor && (
                <Button size="small" type="dashed" block icon={<UndoOutlined />} onClick={() => handleColorChange(undefined)}>
                  恢复默认颜色
                </Button>
              )}
            </div>
          }
        >
          <Tooltip title="配置图标颜色">
            <Button
              size={layout.size as any}
              disabled={disabled || !currentBaseName}
              style={{ padding: '0 8px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              <BgColorsOutlined style={{ color: currentColor || '#1677ff', fontSize: 14 }} />
              <span
                style={{
                  display: 'inline-block',
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  backgroundColor: currentColor || 'transparent',
                  border: currentColor ? '1px solid #d9d9d9' : '1px dashed #bfbfbf',
                }}
              />
            </Button>
          </Tooltip>
        </Popover>

        {/* 3. 大小配置按钮（内嵌在紧凑按钮组中） */}
        <Popover
          trigger="click"
          placement="bottom"
          title={<div style={{ fontWeight: 600, fontSize: 13 }}>配置图标尺寸</div>}
          content={
            <div style={{ width: 220, padding: 4 }}>
              <div style={{ marginBottom: 8, fontSize: 12, color: '#8c8c8c' }}>预设规格：</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, marginBottom: 12 }}>
                {PRESET_ICON_SIZES.map((s) => (
                  <Button
                    key={s.value}
                    size="small"
                    type={currentSize === s.value ? 'primary' : 'default'}
                    onClick={() => handleSizeChange(s.value)}
                    style={{ fontSize: 12 }}
                  >
                    {s.label}
                  </Button>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 12 }}>自定义:</span>
                <Input
                  size="small"
                  style={{ width: 110, fontSize: 12 }}
                  value={currentSize || ''}
                  placeholder="如 20px"
                  onChange={(e) => handleSizeChange(e.target.value)}
                />
              </div>
              {currentSize && (
                <Button size="small" type="dashed" block icon={<UndoOutlined />} onClick={() => handleSizeChange(undefined)}>
                  恢复默认大小
                </Button>
              )}
            </div>
          }
        >
          <Tooltip title="配置图标大小">
            <Button
              size={layout.size as any}
              disabled={disabled || !currentBaseName}
              style={{ padding: '0 8px', display: 'inline-flex', alignItems: 'center', gap: 3 }}
            >
              <FontSizeOutlined style={{ fontSize: 14 }} />
              <span style={{ fontSize: 12, color: currentSize ? '#1677ff' : '#8c8c8c' }}>
                {currentSize ? currentSize.replace('px', '') : '默认'}
              </span>
            </Button>
          </Tooltip>
        </Popover>

        {/* 4. 清除按钮 */}
        {effectiveValue && !disabled && (
          <Tooltip title="清空图标">
            <Button
              size={layout.size as any}
              icon={<CloseOutlined style={{ fontSize: 12 }} />}
              onClick={() => {
                setInternalValue(null);
                onChange?.(null);
                onChangeComplete?.(null);
              }}
            />
          </Tooltip>
        )}
      </Space.Compact>

      {/* 自定义 SVG / 导入弹窗 */}
      <CustomIconModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        apiClient={apiClient}
        onSuccess={(newItem) => {
          setActiveTab(`custom:${newItem.category || 'custom'}`);
          handleSelectIcon(newItem.name);
        }}
      />
    </div>
  );
}

let CachedConnectedPicker: any = null;

export const EnhancedIconPicker: React.FC<any> = (props: any) => {
  if (!CachedConnectedPicker) {
    const { fr, fs } = getFormilyBindings();
    const conn = fr?.connect;
    const mp = fr?.mapProps;
    const mrp = fr?.mapReadPretty;
    const isVal = fs?.isValid || ((val: any) => val !== null && val !== undefined && val !== '');

    if (typeof conn === 'function') {
      try {
        CachedConnectedPicker = conn(
          EnhancedIconField,
          typeof mp === 'function'
            ? mp((p: any, field: any) => ({
                ...p,
                suffix: (
                  <span>{field?.['loading'] || field?.['validating'] ? <LoadingOutlined /> : p?.suffix}</span>
                ),
              }))
            : undefined,
          typeof mrp === 'function'
            ? mrp((readProps: any) => {
                if (!isVal(readProps?.value)) {
                  return <div></div>;
                }
                const { name, color, size } = parseIconValue(readProps?.value);
                return (
                  <RenderPreviewIcon
                    name={name || readProps?.value || ''}
                    color={color}
                    size={size}
                  />
                );
              })
            : undefined,
        );
      } catch (e) {
        CachedConnectedPicker = EnhancedIconField;
      }
    } else {
      CachedConnectedPicker = EnhancedIconField;
    }
  }
  return React.createElement(CachedConnectedPicker, props);
};

export default EnhancedIconPicker;
