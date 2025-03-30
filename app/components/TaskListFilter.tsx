import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

export type SortOption = 'title' | 'dueDate' | 'startDate' | 'createdAt' | 'lastUpdated';
export type SortDirection = 'asc' | 'desc';
export type TaskStatusFilter = 'all' | 'active' | 'completed' | 'overdue';

export interface FilterOptions {
  searchText: string;
  sortBy: SortOption;
  sortDirection: SortDirection;
  statusFilter: TaskStatusFilter;
  tagsFilter: string[];
  showDisabled: boolean;
}

interface TaskListFilterProps {
  filterOptions: FilterOptions;
  onFilterChange: (options: FilterOptions) => void;
  availableTags: string[];
}

export default function TaskListFilter({
  filterOptions,
  onFilterChange,
  availableTags
}: TaskListFilterProps) {
  const { t } = useLanguage();
  const { colors, isDarkMode } = useTheme();
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [tempOptions, setTempOptions] = useState<FilterOptions>({ ...filterOptions });

  // 处理搜索文本变化
  const handleSearchChange = (text: string) => {
    const newOptions = { ...filterOptions, searchText: text };
    onFilterChange(newOptions);
  };

  // 处理排序选项变化
  const handleSortChange = (sortBy: SortOption, sortDirection: SortDirection) => {
    setSortModalVisible(false);
    const newOptions = { ...filterOptions, sortBy, sortDirection };
    onFilterChange(newOptions);
  };

  // 处理状态筛选变化
  const handleStatusFilterChange = (statusFilter: TaskStatusFilter) => {
    setTempOptions({ ...tempOptions, statusFilter });
  };

  // 处理是否显示禁用任务
  const handleShowDisabledChange = (showDisabled: boolean) => {
    setTempOptions({ ...tempOptions, showDisabled });
  };

  // 处理标签筛选变化
  const handleTagsFilterChange = (tag: string) => {
    const currentTags = [...tempOptions.tagsFilter];
    const tagIndex = currentTags.indexOf(tag);
    
    if (tagIndex >= 0) {
      currentTags.splice(tagIndex, 1);
    } else {
      currentTags.push(tag);
    }
    
    setTempOptions({ ...tempOptions, tagsFilter: currentTags });
  };

  // 应用筛选器
  const applyFilters = () => {
    setFilterModalVisible(false);
    onFilterChange(tempOptions);
  };

  // 重置筛选器
  const resetFilters = () => {
    const resetOptions: FilterOptions = {
      ...tempOptions,
      statusFilter: 'all',
      tagsFilter: [],
      showDisabled: true
    };
    setTempOptions(resetOptions);
  };

  // 生成排序选项的显示文本
  const getSortText = (): string => {
    let sortText = '';
    
    switch (filterOptions.sortBy) {
      case 'title':
        sortText = t.task.sortByName;
        break;
      case 'dueDate':
        sortText = t.task.sortByDueDate;
        break;
      case 'startDate':
        sortText = t.task.sortByStartDate;
        break;
      case 'createdAt':
        sortText = t.task.sortByCreatedDate || '创建日期';
        break;
      case 'lastUpdated':
        sortText = t.task.sortByLastUpdated || '最后更新';
        break;
    }
    
    sortText += ' - ' + (filterOptions.sortDirection === 'asc' ? t.task.ascending : t.task.descending);
    return sortText;
  };

  // 状态筛选项
  const handleStatusFilter = (status: TaskStatusFilter) => {
    const newOptions = { ...filterOptions, statusFilter: status };
    setTempOptions(newOptions);
    onFilterChange(newOptions);
    setFilterModalVisible(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      {/* 搜索栏 */}
      <View style={[styles.searchContainer, { backgroundColor: isDarkMode ? colors.background : '#f0f0f0' }]}>
        <Ionicons name="search" size={20} color={colors.subText} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder={t.task.searchPlaceholder}
          placeholderTextColor={colors.subText}
          value={filterOptions.searchText}
          onChangeText={handleSearchChange}
          clearButtonMode="while-editing"
        />
        {filterOptions.searchText ? (
          <TouchableOpacity onPress={() => handleSearchChange('')}>
            <Ionicons name="close-circle" size={20} color={colors.subText} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* 显示筛选条件数量 */}
      {(filterOptions.statusFilter !== 'all' || 
       filterOptions.tagsFilter.length > 0 || 
       !filterOptions.showDisabled) && (
        <View style={[styles.filterBadge, { backgroundColor: colors.primary }]}>
          <Text style={styles.filterBadgeText}>
            {(filterOptions.statusFilter !== 'all' ? 1 : 0) + 
             (filterOptions.tagsFilter.length > 0 ? 1 : 0) + 
             (!filterOptions.showDisabled ? 1 : 0)}
          </Text>
        </View>
      )}
      
      {/* 筛选按钮 */}
      <TouchableOpacity 
        style={styles.iconButton} 
        onPress={() => {
          setTempOptions({ ...filterOptions });
          setFilterModalVisible(true);
        }}
      >
        <Ionicons name="filter" size={22} color={colors.text} />
      </TouchableOpacity>
      
      {/* 排序按钮 */}
      <TouchableOpacity 
        style={styles.iconButton} 
        onPress={() => setSortModalVisible(true)}
      >
        <Ionicons name="swap-vertical" size={22} color={colors.text} />
      </TouchableOpacity>

      {/* 筛选模态框 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={filterModalVisible}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t.task.filterTasks}</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {/* 任务状态筛选 */}
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.task.statusFilter}</Text>
              <View style={styles.statusOptions}>
                <TouchableOpacity
                  style={[
                    styles.statusOption, 
                    { backgroundColor: isDarkMode ? '#333' : '#f0f0f0' },
                    filterOptions.statusFilter === 'all' && [styles.selectedStatusOption, { backgroundColor: colors.primary }]
                  ]}
                  onPress={() => handleStatusFilter('all')}
                >
                  <Text style={[
                    styles.statusText, 
                    { color: filterOptions.statusFilter === 'all' ? '#ffffff' : colors.text }
                  ]}>{t.task.statusAll}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.statusOption,
                    { backgroundColor: isDarkMode ? '#333' : '#f0f0f0' },
                    filterOptions.statusFilter === 'active' && [styles.selectedStatusOption, { backgroundColor: colors.primary }]
                  ]}
                  onPress={() => handleStatusFilter('active')}
                >
                  <Text style={[
                    styles.statusText,
                    { color: filterOptions.statusFilter === 'active' ? '#ffffff' : colors.text }
                  ]}>{t.task.statusActive}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.statusOption,
                    { backgroundColor: isDarkMode ? '#333' : '#f0f0f0' },
                    filterOptions.statusFilter === 'completed' && [styles.selectedStatusOption, { backgroundColor: colors.primary }]
                  ]}
                  onPress={() => handleStatusFilter('completed')}
                >
                  <Text style={[
                    styles.statusText,
                    { color: filterOptions.statusFilter === 'completed' ? '#ffffff' : colors.text }
                  ]}>{t.task.statusCompleted}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.statusOption,
                    { backgroundColor: isDarkMode ? '#333' : '#f0f0f0' },
                    filterOptions.statusFilter === 'overdue' && [styles.selectedStatusOption, { backgroundColor: colors.primary }]
                  ]}
                  onPress={() => handleStatusFilter('overdue')}
                >
                  <Text style={[
                    styles.statusText,
                    { color: filterOptions.statusFilter === 'overdue' ? '#ffffff' : colors.text }
                  ]}>{t.task.statusOverdue}</Text>
                </TouchableOpacity>
              </View>

              {/* 禁用任务显示设置 */}
              <View style={styles.switchRow}>
                <Text style={[styles.switchLabel, { color: colors.text }]}>{t.task.showDisabledTasks}</Text>
                <Switch
                  value={tempOptions.showDisabled}
                  onValueChange={handleShowDisabledChange}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={tempOptions.showDisabled ? '#ffffff' : '#f4f3f4'}
                />
              </View>

              {/* 标签筛选 */}
              {availableTags.length > 0 && (
                <>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.task.filterByTags}</Text>
                  <View style={styles.tagsContainer}>
                    {availableTags.map((tag, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.tagOption,
                          { backgroundColor: isDarkMode ? '#333' : '#f0f0f0' },
                          tempOptions.tagsFilter.includes(tag) && [styles.selectedTagOption, { backgroundColor: colors.primary }]
                        ]}
                        onPress={() => handleTagsFilterChange(tag)}
                      >
                        <Text style={[
                          styles.tagText,
                          { color: tempOptions.tagsFilter.includes(tag) ? '#ffffff' : colors.text }
                        ]}>{tag}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {/* 按钮组 */}
              <View style={styles.buttonRow}>
                <TouchableOpacity 
                  style={[styles.resetButton, { borderColor: colors.border }]} 
                  onPress={resetFilters}
                >
                  <Text style={[styles.resetButtonText, { color: colors.text }]}>{t.task.reset}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.applyButton, { backgroundColor: colors.primary }]} 
                  onPress={applyFilters}
                >
                  <Text style={styles.applyButtonText}>{t.task.apply}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 排序模态框 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={sortModalVisible}
        onRequestClose={() => setSortModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t.task.sortTasks}</Text>
              <TouchableOpacity onPress={() => setSortModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.task.sort}</Text>
              
              {/* 排序选项 */}
              <TouchableOpacity
                style={[styles.sortOption, { borderBottomColor: colors.border }]}
                onPress={() => handleSortChange('title', 'asc')}
              >
                <Text style={[styles.sortOptionText, { color: colors.text }]}>{t.task.sortByName} ({t.task.ascending})</Text>
                {filterOptions.sortBy === 'title' && filterOptions.sortDirection === 'asc' && (
                  <Ionicons name="checkmark" size={22} color={colors.primary} />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.sortOption, { borderBottomColor: colors.border }]}
                onPress={() => handleSortChange('title', 'desc')}
              >
                <Text style={[styles.sortOptionText, { color: colors.text }]}>{t.task.sortByName} ({t.task.descending})</Text>
                {filterOptions.sortBy === 'title' && filterOptions.sortDirection === 'desc' && (
                  <Ionicons name="checkmark" size={22} color={colors.primary} />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.sortOption, { borderBottomColor: colors.border }]}
                onPress={() => handleSortChange('dueDate', 'asc')}
              >
                <Text style={[styles.sortOptionText, { color: colors.text }]}>{t.task.sortByDueDate} ({t.task.ascending})</Text>
                {filterOptions.sortBy === 'dueDate' && filterOptions.sortDirection === 'asc' && (
                  <Ionicons name="checkmark" size={22} color={colors.primary} />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.sortOption, { borderBottomColor: colors.border }]}
                onPress={() => handleSortChange('dueDate', 'desc')}
              >
                <Text style={[styles.sortOptionText, { color: colors.text }]}>{t.task.sortByDueDate} ({t.task.descending})</Text>
                {filterOptions.sortBy === 'dueDate' && filterOptions.sortDirection === 'desc' && (
                  <Ionicons name="checkmark" size={22} color={colors.primary} />
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
    elevation: 2,
    zIndex: 10,
    marginBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    backgroundColor: '#f6f6f6',
    borderRadius: 8,
    paddingHorizontal: 8,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#333',
  },
  iconButton: {
    padding: 8,
    marginLeft: 4,
  },
  filterBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 8,
    right: 66,
  },
  filterBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalScroll: {
    padding: 16,
    maxHeight: 400,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 12,
  },
  statusOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  statusOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    marginBottom: 8,
  },
  selectedStatusOption: {
    backgroundColor: '#007AFF',
  },
  statusText: {
    fontSize: 14,
    color: 'white',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  tagOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    marginBottom: 8,
  },
  tagOptionSelected: {
    backgroundColor: '#007AFF',
  },
  tagOptionText: {
    fontSize: 14,
    color: '#333',
  },
  tagOptionTextSelected: {
    color: 'white',
  },
  tagCheckIcon: {
    marginLeft: 4,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  resetButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 8,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  resetButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#007AFF',
  },
  applyButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sortOptionText: {
    fontSize: 16,
    color: '#333',
  },
  activeFiltersBar: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  activeFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  activeFilterText: {
    fontSize: 14,
    color: '#333',
  },
  clearFilterButton: {
    marginLeft: 4,
  },
  clearAllButton: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  clearAllText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  selectedTagOption: {
    backgroundColor: '#007AFF',
  },
  tagText: {
    fontSize: 14,
    color: '#333',
  },
}); 