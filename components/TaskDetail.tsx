import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Task } from '../models/Task';
import { deleteTask, completeTaskCycle } from '../services/taskService';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface TaskDetailProps {
  task: Task;
  onClose: () => void;
  onEdit: () => void;
  onDelete: (taskId: number) => void;
  testID?: string;
  isLoading?: boolean;
}

export default function TaskDetail({
  task,
  onClose,
  onEdit,
  onDelete,
  isLoading = false,
}: TaskDetailProps) {
  const colorScheme = useColorScheme();
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = () => {
    Alert.alert(
      '删除任务',
      '确定要删除此任务吗？此操作不可恢复。',
      [
        {
          text: '取消',
          style: 'cancel',
        },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);
              await onDelete(task.id);
            } catch (error) {
              console.error('Error deleting task:', error);
              Alert.alert('错误', '删除任务失败');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleComplete = async () => {
    if (!task.currentCycle) {
      Alert.alert('错误', '当前任务没有进行中的周期');
      return;
    }

    try {
      setIsDeleting(true);
      await completeTaskCycle(task.currentCycle.id);
      onClose();
    } catch (error) {
      console.error('Error completing task cycle:', error);
      Alert.alert('错误', '完成任务失败');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (date: string) => {
    return format(new Date(date), 'yyyy年MM月dd日 HH:mm', { locale: zhCN });
  };

  const getRecurrenceText = (task: Task) => {
    switch (task.recurrenceType) {
      case 'daily':
        return 'Daily';
      case 'weekly':
        return 'Weekly';
      case 'monthly':
        return 'Monthly';
      case 'custom':
        return `Every ${task.recurrenceValue} ${task.recurrenceUnit}`;
      default:
        return 'Unknown';
    }
  };

  const getStatusLabel = () => {
    if (!task.currentCycle) return '无进行中的周期';
    if (task.currentCycle.isCompleted) return '已完成';
    if (task.currentCycle.isOverdue) return '已逾期';
    if (!task.isActive) return '已暂停';
    return '进行中';
  };

  const getStatusColor = () => {
    if (!task.currentCycle) return '#999999';
    if (task.currentCycle.isCompleted) return '#4CAF50';
    if (task.currentCycle.isOverdue) return '#F44336';
    if (!task.isActive) return '#999999';
    return '#2196F3';
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={true}
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.modalContainer,
          {
            backgroundColor: colorScheme === 'dark'
              ? 'rgba(0, 0, 0, 0.9)'
              : 'rgba(0, 0, 0, 0.5)',
          },
        ]}
      >
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#ffffff',
            },
          ]}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              disabled={isLoading || isDeleting}
            >
              <Ionicons
                name="close"
                size={24}
                color={colorScheme === 'dark' ? '#ffffff' : '#000000'}
              />
            </TouchableOpacity>
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={onEdit}
                disabled={isLoading || isDeleting}
              >
                <Ionicons
                  name="pencil"
                  size={24}
                  color={colorScheme === 'dark' ? '#ffffff' : '#000000'}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDelete}
                disabled={isLoading || isDeleting}
              >
                <Ionicons
                  name="trash"
                  size={24}
                  color="#ff3b30"
                />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.content}>
            <Text
              style={[
                styles.title,
                { color: colorScheme === 'dark' ? '#ffffff' : '#000000' },
              ]}
            >
              {task.title}
            </Text>

            {task.description && (
              <Text
                style={[
                  styles.description,
                  { color: colorScheme === 'dark' ? '#8e8e93' : '#666666' },
                ]}
              >
                {task.description}
              </Text>
            )}

            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <Text
                  style={[
                    styles.infoLabel,
                    { color: colorScheme === 'dark' ? '#8e8e93' : '#666666' },
                  ]}
                >
                  Recurrence
                </Text>
                <Text
                  style={[
                    styles.infoValue,
                    { color: colorScheme === 'dark' ? '#ffffff' : '#000000' },
                  ]}
                >
                  {getRecurrenceText(task)}
                </Text>
              </View>

              {task.currentCycle && (
                <>
                  <View style={styles.infoRow}>
                    <Text
                      style={[
                        styles.infoLabel,
                        { color: colorScheme === 'dark' ? '#8e8e93' : '#666666' },
                      ]}
                    >
                      Start Date
                    </Text>
                    <Text
                      style={[
                        styles.infoValue,
                        { color: colorScheme === 'dark' ? '#ffffff' : '#000000' },
                      ]}
                    >
                      {format(new Date(task.currentCycle.startDate), 'PPp')}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text
                      style={[
                        styles.infoLabel,
                        { color: colorScheme === 'dark' ? '#8e8e93' : '#666666' },
                      ]}
                    >
                      Due Date
                    </Text>
                    <Text
                      style={[
                        styles.infoValue,
                        {
                          color:
                            new Date(task.currentCycle.dueDate) < new Date()
                              ? '#ff3b30'
                              : colorScheme === 'dark'
                              ? '#ffffff'
                              : '#000000',
                        },
                      ]}
                    >
                      {format(new Date(task.currentCycle.dueDate), 'PPp')}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text
                      style={[
                        styles.infoLabel,
                        { color: colorScheme === 'dark' ? '#8e8e93' : '#666666' },
                      ]}
                    >
                      Status
                    </Text>
                    <Text
                      style={[
                        styles.infoValue,
                        {
                          color: task.currentCycle.isCompleted
                            ? '#34c759'
                            : task.currentCycle.isOverdue
                            ? '#ff3b30'
                            : colorScheme === 'dark'
                            ? '#ffffff'
                            : '#000000',
                        },
                      ]}
                    >
                      {task.currentCycle.isCompleted
                        ? 'Completed'
                        : task.currentCycle.isOverdue
                        ? 'Overdue'
                        : 'Pending'}
                    </Text>
                  </View>
                </>
              )}

              <View style={styles.infoRow}>
                <Text
                  style={[
                    styles.infoLabel,
                    { color: colorScheme === 'dark' ? '#8e8e93' : '#666666' },
                  ]}
                >
                  Auto Restart
                </Text>
                <Text
                  style={[
                    styles.infoValue,
                    { color: colorScheme === 'dark' ? '#ffffff' : '#000000' },
                  ]}
                >
                  {task.autoRestart ? 'Yes' : 'No'}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text
                  style={[
                    styles.infoLabel,
                    { color: colorScheme === 'dark' ? '#8e8e93' : '#666666' },
                  ]}
                >
                  Created
                </Text>
                <Text
                  style={[
                    styles.infoValue,
                    { color: colorScheme === 'dark' ? '#ffffff' : '#000000' },
                  ]}
                >
                  {format(new Date(task.createdAt), 'PPp')}
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 32,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  closeButton: {
    padding: 8,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  editButton: {
    padding: 8,
  },
  deleteButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    marginBottom: 24,
  },
  infoSection: {
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 16,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
}); 