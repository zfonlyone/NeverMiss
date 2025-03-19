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
import { useLanguage } from '../../hooks/useLanguage';

export type SortOption = 'title' | 'dueDate' | 'createdAt' | 'lastUpdated';
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
  onFilterChange: (newOptions: FilterOptions) => void;
  availableTags: string[];
}

export default function TaskListFilter({
  filterOptions,
  onFilterChange,
  availableTags
}: TaskListFilterProps) {
  const { t } = useLanguage();
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
        sortText = t.task.sortByTitle;
        break;
      case 'dueDate':
        sortText = t.task.sortByDueDate;
        break;
      case 'createdAt':
        sortText = t.task.sortByCreatedDate;
        break;
      case 'lastUpdated':
        sortText = t.task.sortByLastUpdated;
        break;
    }
    
    sortText += ' - ' + (filterOptions.sortDirection === 'asc' ? t.task.ascending : t.task.descending);
    return sortText;
  };

  return (
    <View style={styles.container}>
      {/* 搜索栏 */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t.task.searchPlaceholder}
          value={filterOptions.searchText}
          onChangeText={handleSearchChange}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        
        {/* 显示筛选条件数量 */}
        {(filterOptions.statusFilter !== 'all' || 
         filterOptions.tagsFilter.length > 0 || 
         !filterOptions.showDisabled) && (
          <View style={styles.filterBadge}>
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
          <Ionicons name="filter" size={22} color="#666" />
        </TouchableOpacity>
        
        {/* 排序按钮 */}
        <TouchableOpacity 
          style={styles.iconButton} 
          onPress={() => setSortModalVisible(true)}
        >
          <Ionicons name="swap-vertical" size={22} color="#666" />
        </TouchableOpacity>
      </View>

      {/* 筛选模态框 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={filterModalVisible}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.task.filterTasks}</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {/* 任务状态筛选 */}
              <Text style={styles.sectionTitle}>{t.task.status}</Text>
              <View style={styles.statusOptions}>
                <TouchableOpacity
                  style={[
                    styles.statusOption,
                    tempOptions.statusFilter === 'all' && styles.statusOptionSelected
                  ]}
                  onPress={() => handleStatusFilterChange('all')}
                >
                  <Text 
                    style={[
                      styles.statusOptionText,
                      tempOptions.statusFilter === 'all' && styles.statusOptionTextSelected
                    ]}
                  >
                    {t.task.statusAll}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.statusOption,
                    tempOptions.statusFilter === 'active' && styles.statusOptionSelected
                  ]}
                  onPress={() => handleStatusFilterChange('active')}
                >
                  <Text 
                    style={[
                      styles.statusOptionText,
                      tempOptions.statusFilter === 'active' && styles.statusOptionTextSelected
                    ]}
                  >
                    {t.task.statusInProgress}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.statusOption,
                    tempOptions.statusFilter === 'completed' && styles.statusOptionSelected
                  ]}
                  onPress={() => handleStatusFilterChange('completed')}
                >
                  <Text 
                    style={[
                      styles.statusOptionText,
                      tempOptions.statusFilter === 'completed' && styles.statusOptionTextSelected
                    ]}
                  >
                    {t.task.statusCompleted}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.statusOption,
                    tempOptions.statusFilter === 'overdue' && styles.statusOptionSelected
                  ]}
                  onPress={() => handleStatusFilterChange('overdue')}
                >
                  <Text 
                    style={[
                      styles.statusOptionText,
                      tempOptions.statusFilter === 'overdue' && styles.statusOptionTextSelected
                    ]}
                  >
                    {t.task.statusOverdue}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* 禁用任务显示设置 */}
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>{t.task.showDisabledTasks}</Text>
                <Switch
                  value={tempOptions.showDisabled}
                  onValueChange={handleShowDisabledChange}
                  trackColor={{ false: '#ccc', true: '#007AFF' }}
                />
              </View>

              {/* 标签筛选 */}
              {availableTags.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>{t.task.filterByTags}</Text>
                  <View style={styles.tagsContainer}>
                    {availableTags.map((tag, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.tagOption,
                          tempOptions.tagsFilter.includes(tag) && styles.tagOptionSelected
                        ]}
                        onPress={() => handleTagsFilterChange(tag)}
                      >
                        <Text 
                          style={[
                            styles.tagOptionText,
                            tempOptions.tagsFilter.includes(tag) && styles.tagOptionTextSelected
                          ]}
                        >
                          {tag}
                        </Text>
                        {tempOptions.tagsFilter.includes(tag) && (
                          <Ionicons name="checkmark" size={16} color="white" style={styles.tagCheckIcon} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.resetButton} 
                onPress={resetFilters}
              >
                <Text style={styles.resetButtonText}>{t.task.resetFilters}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.applyButton} 
                onPress={applyFilters}
              >
                <Text style={styles.applyButtonText}>{t.task.applyFilters}</Text>
              </TouchableOpacity>
            </View>
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
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.task.sortTasks}</Text>
              <TouchableOpacity onPress={() => setSortModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {/* 排序选项 */}
              <TouchableOpacity
                style={styles.sortOption}
                onPress={() => handleSortChange('title', 'asc')}
              >
                <Text style={styles.sortOptionText}>{t.task.sortByTitle} - {t.task.ascending}</Text>
                {filterOptions.sortBy === 'title' && filterOptions.sortDirection === 'asc' && (
                  <Ionicons name="checkmark" size={20} color="#007AFF" />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.sortOption}
                onPress={() => handleSortChange('title', 'desc')}
              >
                <Text style={styles.sortOptionText}>{t.task.sortByTitle} - {t.task.descending}</Text>
                {filterOptions.sortBy === 'title' && filterOptions.sortDirection === 'desc' && (
                  <Ionicons name="checkmark" size={20} color="#007AFF" />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.sortOption}
                onPress={() => handleSortChange('dueDate', 'asc')}
              >
                <Text style={styles.sortOptionText}>{t.task.sortByDueDate} - {t.task.ascending}</Text>
                {filterOptions.sortBy === 'dueDate' && filterOptions.sortDirection === 'asc' && (
                  <Ionicons name="checkmark" size={20} color="#007AFF" />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.sortOption}
                onPress={() => handleSortChange('dueDate', 'desc')}
              >
                <Text style={styles.sortOptionText}>{t.task.sortByDueDate} - {t.task.descending}</Text>
                {filterOptions.sortBy === 'dueDate' && filterOptions.sortDirection === 'desc' && (
                  <Ionicons name="checkmark" size={20} color="#007AFF" />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.sortOption}
                onPress={() => handleSortChange('createdAt', 'asc')}
              >
                <Text style={styles.sortOptionText}>{t.task.sortByCreatedDate} - {t.task.ascending}</Text>
                {filterOptions.sortBy === 'createdAt' && filterOptions.sortDirection === 'asc' && (
                  <Ionicons name="checkmark" size={20} color="#007AFF" />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.sortOption}
                onPress={() => handleSortChange('createdAt', 'desc')}
              >
                <Text style={styles.sortOptionText}>{t.task.sortByCreatedDate} - {t.task.descending}</Text>
                {filterOptions.sortBy === 'createdAt' && filterOptions.sortDirection === 'desc' && (
                  <Ionicons name="checkmark" size={20} color="#007AFF" />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.sortOption}
                onPress={() => handleSortChange('lastUpdated', 'asc')}
              >
                <Text style={styles.sortOptionText}>{t.task.sortByLastUpdated} - {t.task.ascending}</Text>
                {filterOptions.sortBy === 'lastUpdated' && filterOptions.sortDirection === 'asc' && (
                  <Ionicons name="checkmark" size={20} color="#007AFF" />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.sortOption}
                onPress={() => handleSortChange('lastUpdated', 'desc')}
              >
                <Text style={styles.sortOptionText}>{t.task.sortByLastUpdated} - {t.task.descending}</Text>
                {filterOptions.sortBy === 'lastUpdated' && filterOptions.sortDirection === 'desc' && (
                  <Ionicons name="checkmark" size={20} color="#007AFF" />
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 排序和筛选指示器 */}
      {(filterOptions.searchText || 
        filterOptions.statusFilter !== 'all' || 
        filterOptions.tagsFilter.length > 0 || 
        !filterOptions.showDisabled) && (
        <View style={styles.activeFiltersBar}>
          {filterOptions.searchText && (
            <View style={styles.activeFilter}>
              <Text style={styles.activeFilterText}>
                {t.task.search}: {filterOptions.searchText}
              </Text>
              <TouchableOpacity 
                onPress={() => handleSearchChange('')}
                style={styles.clearFilterButton}
              >
                <Ionicons name="close-circle" size={16} color="#666" />
              </TouchableOpacity>
            </View>
          )}
          
          {filterOptions.statusFilter !== 'all' && (
            <View style={styles.activeFilter}>
              <Text style={styles.activeFilterText}>
                {filterOptions.statusFilter === 'active' && t.task.statusInProgress}
                {filterOptions.statusFilter === 'completed' && t.task.statusCompleted}
                {filterOptions.statusFilter === 'overdue' && t.task.statusOverdue}
              </Text>
              <TouchableOpacity 
                onPress={() => {
                  const newOptions = { ...filterOptions, statusFilter: 'all' };
                  onFilterChange(newOptions);
                }}
                style={styles.clearFilterButton}
              >
                <Ionicons name="close-circle" size={16} color="#666" />
              </TouchableOpacity>
            </View>
          )}
          
          {filterOptions.tagsFilter.length > 0 && (
            <View style={styles.activeFilter}>
              <Text style={styles.activeFilterText}>
                {t.task.tags}: {filterOptions.tagsFilter.join(', ')}
              </Text>
              <TouchableOpacity 
                onPress={() => {
                  const newOptions = { ...filterOptions, tagsFilter: [] };
                  onFilterChange(newOptions);
                }}
                style={styles.clearFilterButton}
              >
                <Ionicons name="close-circle" size={16} color="#666" />
              </TouchableOpacity>
            </View>
          )}
          
          {!filterOptions.showDisabled && (
            <View style={styles.activeFilter}>
              <Text style={styles.activeFilterText}>{t.task.hidingDisabledTasks}</Text>
              <TouchableOpacity 
                onPress={() => {
                  const newOptions = { ...filterOptions, showDisabled: true };
                  onFilterChange(newOptions);
                }}
                style={styles.clearFilterButton}
              >
                <Ionicons name="close-circle" size={16} color="#666" />
              </TouchableOpacity>
            </View>
          )}
          
          <TouchableOpacity 
            style={styles.clearAllButton}
            onPress={() => {
              const newOptions: FilterOptions = {
                ...filterOptions,
                searchText: '',
                statusFilter: 'all',
                tagsFilter: [],
                showDisabled: true
              };
              onFilterChange(newOptions);
            }}
          >
            <Text style={styles.clearAllText}>{t.task.clearAllFilters}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  iconButton: {
    padding: 8,
    marginLeft: 4,
  },
  filterBadge: {
    backgroundColor: '#007AFF',
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
    color: 'white',
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
  statusOptionSelected: {
    backgroundColor: '#007AFF',
  },
  statusOptionText: {
    fontSize: 14,
    color: '#333',
  },
  statusOptionTextSelected: {
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
}); 