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
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Ionicons } from '@expo/vector-icons';

export type SpecialDateType = 'holiday' | 'solarTerm' | 'custom';

export interface SpecialDate {
  id: string;
  name: string;
  type: SpecialDateType;
  month: number;
  day: number;
  isLunar?: boolean;
}

interface SpecialDateSelectorProps {
  selectedDate?: SpecialDate | null;
  onDateSelect: (date: SpecialDate | null) => void;
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
  const [filteredDates, setFilteredDates] = useState<SpecialDate[]>([]);
  const [activeTab, setActiveTab] = useState<SpecialDateType>('holiday');

  // Predefined special dates - in a real app, these would come from a data file or API
  const holidays: SpecialDate[] = [
    { id: 'spring_festival', name: '春节', type: 'holiday', month: 1, day: 1, isLunar: true },
    { id: 'lantern_festival', name: '元宵节', type: 'holiday', month: 1, day: 15, isLunar: true },
    { id: 'dragon_boat', name: '端午节', type: 'holiday', month: 5, day: 5, isLunar: true },
    { id: 'mid_autumn', name: '中秋节', type: 'holiday', month: 8, day: 15, isLunar: true },
    { id: 'new_year', name: '元旦', type: 'holiday', month: 1, day: 1, isLunar: false },
    { id: 'labor_day', name: '劳动节', type: 'holiday', month: 5, day: 1, isLunar: false },
    { id: 'national_day', name: '国庆节', type: 'holiday', month: 10, day: 1, isLunar: false },
  ];

  const solarTerms: SpecialDate[] = [
    { id: 'lichun', name: '立春', type: 'solarTerm', month: 2, day: 4, isLunar: false },
    { id: 'jingzhe', name: '惊蛰', type: 'solarTerm', month: 3, day: 6, isLunar: false },
    { id: 'qingming', name: '清明', type: 'solarTerm', month: 4, day: 5, isLunar: false },
    { id: 'lixia', name: '立夏', type: 'solarTerm', month: 5, day: 6, isLunar: false },
    { id: 'mangzhong', name: '芒种', type: 'solarTerm', month: 6, day: 6, isLunar: false },
    { id: 'xiazhi', name: '夏至', type: 'solarTerm', month: 6, day: 21, isLunar: false },
    { id: 'lidong', name: '立冬', type: 'solarTerm', month: 11, day: 7, isLunar: false },
    { id: 'dongzhi', name: '冬至', type: 'solarTerm', month: 12, day: 22, isLunar: false },
  ];

  // Combined list for searching
  const allDates = [...holidays, ...solarTerms];

  useEffect(() => {
    filterDates();
  }, [searchQuery, activeTab]);

  const filterDates = () => {
    // Filter by tab and search query
    let filtered = allDates.filter(date => date.type === activeTab || activeTab === 'custom');
    
    // If search query exists, further filter by name
    if (searchQuery.trim()) {
      filtered = filtered.filter(date => 
        date.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter by calendar type
    if (activeTab !== 'custom') {
      filtered = filtered.filter(date => 
        isLunarCalendar ? date.isLunar : !date.isLunar
      );
    }
    
    setFilteredDates(filtered);
  };

  const handleSelect = (date: SpecialDate) => {
    onDateSelect(date);
    setModalVisible(false);
  };

  const handleClear = () => {
    onDateSelect(null);
  };

  const renderDateItem = ({ item }: { item: SpecialDate }) => (
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
            </View>

            <FlatList
              data={filteredDates}
              renderItem={renderDateItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.dateList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: colors.subText }]}>
                    {t.task.noMatchingDates || '没有匹配的日期'}
                  </Text>
                </View>
              }
            />
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
});

export default SpecialDateSelector; 