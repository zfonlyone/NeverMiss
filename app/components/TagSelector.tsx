import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';

// 预定义的标签颜色
const TAG_COLORS = [
  '#FF9500', // 橙色
  '#FF2D55', // 粉红色
  '#5856D6', // 紫色
  '#007AFF', // 蓝色
  '#4CD964', // 绿色
  '#FFCC00', // 黄色
  '#8E8E93', // 灰色
  '#FF3B30', // 红色
];

interface TagSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

export default function TagSelector({ selectedTags, onTagsChange }: TagSelectorProps) {
  const { t } = useLanguage();
  const { colors, isDarkMode } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [newTag, setNewTag] = useState('');
  
  // 预定义的通用标签
  const commonTags = [
    t.task.important,
    t.task.work,
    t.task.personal,
    t.task.home,
    t.task.health,
    t.task.finance,
    t.task.study,
    t.task.project
  ];

  const handleAddTag = () => {
    if (newTag.trim() && !selectedTags.includes(newTag.trim())) {
      const updatedTags = [...selectedTags, newTag.trim()];
      onTagsChange(updatedTags);
      setNewTag('');
    }
  };

  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter(t => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const handleRemoveTag = (tag: string) => {
    onTagsChange(selectedTags.filter(t => t !== tag));
  };

  // 显示当前已选择的标签
  const renderSelectedTags = () => {
    if (selectedTags.length === 0) {
      return (
        <TouchableOpacity 
          style={styles.addTagButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
          <Text style={[styles.addTagText, { color: colors.primary }]}>{t.task.addTags}</Text>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.selectedTagsContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.selectedTagsScroll}
        >
          {selectedTags.map((tag, index) => (
            <View key={index} style={[
              styles.selectedTag, 
              { backgroundColor: isDarkMode ? '#333' : '#f0f0f0' }
            ]}>
              <Text style={[
                styles.selectedTagText, 
                { color: colors.text }
              ]}>{tag}</Text>
              <TouchableOpacity 
                onPress={() => handleRemoveTag(tag)}
                style={styles.removeTagButton}
              >
                <Ionicons name="close-circle" size={16} color={colors.subText} />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity 
            style={styles.addMoreButton}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="add" size={18} color={colors.primary} />
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>{t.task.tags}</Text>
      {renderSelectedTags()}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t.task.selectTags}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.subText} />
              </TouchableOpacity>
            </View>

            <View style={styles.addTagContainer}>
              <TextInput
                style={[
                  styles.tagInput, 
                  { 
                    backgroundColor: isDarkMode ? colors.background : '#f9f9f9',
                    borderColor: colors.border,
                    color: colors.text
                  }
                ]}
                placeholder={t.task.newTagPlaceholder}
                placeholderTextColor={colors.subText}
                value={newTag}
                onChangeText={setNewTag}
                returnKeyType="done"
                onSubmitEditing={handleAddTag}
              />
              <TouchableOpacity 
                style={[
                  styles.addButton,
                  { backgroundColor: colors.primary },
                  !newTag.trim() && { opacity: 0.5 }
                ]}
                onPress={handleAddTag}
                disabled={!newTag.trim()}
              >
                <Text style={styles.addButtonText}>
                  {t.task.add}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.task.commonTags}</Text>
            <View style={styles.commonTagsContainer}>
              {commonTags.map((tag, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.commonTag,
                    { backgroundColor: isDarkMode ? '#333' : '#f0f0f0' },
                    selectedTags.includes(tag) && [styles.commonTagSelected, { backgroundColor: colors.primary }]
                  ]}
                  onPress={() => handleToggleTag(tag)}
                >
                  <Text style={[
                    styles.commonTagText,
                    { color: selectedTags.includes(tag) ? 'white' : colors.text }
                  ]}>
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {selectedTags.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.task.selectedTags}</Text>
                <View style={styles.selectedTagsGrid}>
                  {selectedTags.map((tag, index) => (
                    <View key={index} style={[
                      styles.selectedTagInModal, 
                      { backgroundColor: colors.primary }
                    ]}>
                      <Text style={styles.selectedTagInModalText}>{tag}</Text>
                      <TouchableOpacity 
                        onPress={() => handleRemoveTag(tag)}
                        style={styles.removeTagButtonInModal}
                      >
                        <Ionicons name="close-circle" size={16} color="white" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </>
            )}

            <TouchableOpacity 
              style={[styles.doneButton, { backgroundColor: colors.primary }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.doneButtonText}>{t.common.done}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  addTagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  addTagText: {
    marginLeft: 4,
    fontSize: 15,
  },
  selectedTagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedTagsScroll: {
    paddingVertical: 8,
  },
  selectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  selectedTagText: {
    fontSize: 14,
    marginRight: 4,
  },
  removeTagButton: {
    marginLeft: 2,
  },
  addMoreButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 30,
    paddingTop: 16,
    paddingHorizontal: 16,
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
  addTagContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tagInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    fontSize: 16,
  },
  addButton: {
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  addButtonTextDisabled: {
    opacity: 0.5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 12,
  },
  commonTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  commonTag: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  commonTagSelected: {
    backgroundColor: '#007AFF',
  },
  commonTagText: {
    fontSize: 14,
  },
  commonTagTextSelected: {
    color: 'white',
  },
  selectedTagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  selectedTagInModal: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedTagInModalText: {
    fontSize: 14,
    color: 'white',
    marginRight: 4,
  },
  removeTagButtonInModal: {
    marginLeft: 2,
  },
  doneButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
}); 