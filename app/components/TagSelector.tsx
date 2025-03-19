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
import { useLanguage } from '../../hooks/useLanguage';

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
          <Ionicons name="add-circle-outline" size={18} color="#007AFF" />
          <Text style={styles.addTagText}>{t.task.addTags}</Text>
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
            <View key={index} style={styles.selectedTag}>
              <Text style={styles.selectedTagText}>{tag}</Text>
              <TouchableOpacity 
                onPress={() => handleRemoveTag(tag)}
                style={styles.removeTagButton}
              >
                <Ionicons name="close-circle" size={16} color="#8E8E93" />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity 
            style={styles.addMoreButton}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="add" size={18} color="#007AFF" />
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t.task.tags}</Text>
      {renderSelectedTags()}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.task.selectTags}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            <View style={styles.addTagContainer}>
              <TextInput
                style={styles.tagInput}
                placeholder={t.task.newTagPlaceholder}
                value={newTag}
                onChangeText={setNewTag}
                returnKeyType="done"
                onSubmitEditing={handleAddTag}
              />
              <TouchableOpacity 
                style={styles.addButton}
                onPress={handleAddTag}
                disabled={!newTag.trim()}
              >
                <Text style={[
                  styles.addButtonText,
                  !newTag.trim() && styles.addButtonTextDisabled
                ]}>
                  {t.task.add}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>{t.task.commonTags}</Text>
            <View style={styles.commonTagsContainer}>
              {commonTags.map((tag, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.commonTag,
                    selectedTags.includes(tag) && styles.commonTagSelected
                  ]}
                  onPress={() => handleToggleTag(tag)}
                >
                  <Text style={[
                    styles.commonTagText,
                    selectedTags.includes(tag) && styles.commonTagTextSelected
                  ]}>
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {selectedTags.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>{t.task.selectedTags}</Text>
                <View style={styles.selectedTagsGrid}>
                  {selectedTags.map((tag, index) => (
                    <View key={index} style={styles.selectedTagInModal}>
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
              style={styles.doneButton}
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
    color: '#333',
  },
  addTagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  addTagText: {
    color: '#007AFF',
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
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  selectedTagText: {
    fontSize: 14,
    color: '#333',
    marginRight: 4,
  },
  removeTagButton: {
    marginLeft: 2,
  },
  addMoreButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
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
    padding: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  addTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tagInput: {
    flex: 1,
    height: 44,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  addButton: {
    paddingHorizontal: 16,
    height: 44,
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    borderLeftWidth: 1,
    borderLeftColor: '#e0e0e0',
  },
  addButtonText: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 16,
  },
  addButtonTextDisabled: {
    color: '#bbb',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  commonTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  commonTag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    marginBottom: 8,
  },
  commonTagSelected: {
    backgroundColor: '#007AFF',
  },
  commonTagText: {
    fontSize: 14,
    color: '#333',
  },
  commonTagTextSelected: {
    color: 'white',
  },
  selectedTagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
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
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  doneButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 