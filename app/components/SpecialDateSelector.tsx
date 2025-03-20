import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import { SpecialDate as SpecialDateModel, SpecialDateType } from '../../models/Task';
import SpecialDateController from '../../controllers/SpecialDateController';

interface SpecialDateSelectorProps {
  selectedDate?: SpecialDateModel | null;
  onDateSelect: (date: SpecialDateModel | null) => void;
  isLunarCalendar: boolean;
}

const SpecialDateSelector: React.FC<SpecialDateSelectorProps> = ({
  selectedDate,
  onDateSelect,
  isLunarCalendar
}) => {
  const { colors, isDarkMode } = useTheme();
  const { t } = useLanguage();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredDates, setFilteredDates] = useState<SpecialDateModel[]>([]);
  const [activeTab, setActiveTab] = useState<SpecialDateType>('holiday');
  const [isLoading, setIsLoading] = useState(false);
  const [allDates, setAllDates] = useState<{
    holiday: SpecialDateModel[];
    solarTerm: SpecialDateModel[];
    custom: SpecialDateModel[];
  }>({
    holiday: [],
    solarTerm: [],
    custom: []
  });

  // Load special dates when component mounts
  useEffect(() => {
    loadSpecialDates();
  }, []);

  // Load dates from the controller
  const loadSpecialDates = async () => {
    setIsLoading(true);
    try {
      const dates = await SpecialDateController.loadAllSpecialDates();
      setAllDates(dates);
    } catch (error) {
      console.error('Error loading special dates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter dates based on search and active tab
  useEffect(() => {
    filterDates();
  }, [searchQuery, activeTab, allDates, isLunarCalendar]);

  const filterDates = () => {
    // Get the appropriate array based on the active tab
    let datesToFilter: SpecialDateModel[] = [];
    
    switch (activeTab) {
      case 'holiday':
        datesToFilter = allDates.holiday;
        break;
      case 'solarTerm':
        datesToFilter = allDates.solarTerm;
        break;
      case 'custom':
        datesToFilter = allDates.custom;
        break;
    }
    
    // Filter by search query if provided
    let filtered = datesToFilter;
    if (searchQuery.trim()) {
      filtered = filtered.filter(date => 
        date.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter by lunar/solar calendar type if not custom
    if (activeTab !== 'custom') {
      filtered = filtered.filter(date => 
        isLunarCalendar ? date.isLunar : !date.isLunar
      );
    }
    
    setFilteredDates(filtered);
  };

  const handleSelect = (date: SpecialDateModel) => {
    onDateSelect(date);
    setModalVisible(false);
  };

  const handleClear = () => {
    onDateSelect(null);
  };

  const renderDateItem = ({ item }: { item: SpecialDateModel }) => (
    <TouchableOpacity
      style={[
        styles.dateItem,
        { backgroundColor: colors.card },
        selectedDate?.id === item.id && { backgroundColor: colors.primary + '30' }
      ]}
      onPress={() => handleSelect(item)}
    >
      <Text style={[styles.dateName, { color: colors.text }]}>
        {item.name}
      </Text>
      <Text style={[styles.dateInfo, { color: colors.subText }]}>
        {item.isLunar ? '农历' : '公历'} {item.month}月{item.day}日
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.text }]}>
          {t.task.specialDates || '特殊日期'}
        </Text>
        <View style={styles.buttonGroup}>
          {selectedDate && (
            <TouchableOpacity
              style={[styles.clearButton, { borderColor: colors.border }]}
              onPress={handleClear}
            >
              <Text style={{ color: colors.primary }}>{t.common.clear || '清除'}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.selectButton, { backgroundColor: colors.primary }]}
            onPress={() => setModalVisible(true)}
          >
            <Text style={{ color: '#ffffff' }}>{t.task.select || '选择'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {selectedDate ? (
        <View style={[styles.selectedDateContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.selectedDateName, { color: colors.text }]}>
            {selectedDate.name}
          </Text>
          <Text style={[styles.selectedDateInfo, { color: colors.subText }]}>
            {selectedDate.isLunar ? '农历' : '公历'} {selectedDate.month}月{selectedDate.day}日
          </Text>
        </View>
      ) : (
        <View style={[styles.noDateContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.noDateText, { color: colors.subText }]}>
            {t.task.noSpecialDateSelected || '未选择特殊日期'}
          </Text>
        </View>
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t.task.selectSpecialDate || '选择特殊日期'}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="search" size={20} color={colors.subText} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder={t.task.searchSpecialDates || '搜索特殊日期...'}
                placeholderTextColor={colors.subText}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery !== '' && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={16} color={colors.subText} />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === 'holiday' && [styles.activeTab, { backgroundColor: colors.primary }]
                ]}
                onPress={() => setActiveTab('holiday')}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: activeTab === 'holiday' ? '#ffffff' : colors.text }
                  ]}
                >
                  {t.task.holidays || '节假日'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === 'solarTerm' && [styles.activeTab, { backgroundColor: colors.primary }]
                ]}
                onPress={() => setActiveTab('solarTerm')}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: activeTab === 'solarTerm' ? '#ffffff' : colors.text }
                  ]}
                >
                  {t.task.solarTerms || '节气'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tab, 
                  activeTab === 'custom' && [styles.activeTab, { backgroundColor: colors.primary }]
                ]}
                onPress={() => setActiveTab('custom')}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: activeTab === 'custom' ? '#ffffff' : colors.text }
                  ]}
                >
                  {t.task.customDates || '自定义'}
                </Text>
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.text }]}>
                  {t.common.loading || '加载中...'}
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredDates}
                renderItem={renderDateItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.dateList}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyText, { color: colors.subText }]}>
                      {activeTab === 'custom' 
                        ? (t.task.noCustomDates || '没有自定义日期') 
                        : (t.task.noMatchingDates || '没有匹配的日期')}
                    </Text>
                  </View>
                }
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonGroup: {
    flexDirection: 'row',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    marginRight: 8,
  },
  selectButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  selectedDateContainer: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  selectedDateName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  selectedDateInfo: {
    fontSize: 14,
  },
  noDateContainer: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDateText: {
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '80%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontWeight: '500',
  },
  dateList: {
    paddingBottom: 20,
  },
  dateItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  dateName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  dateInfo: {
    fontSize: 14,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
});

export default SpecialDateSelector; 