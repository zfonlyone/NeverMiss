import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Task } from '../models/Task';
import { completeTaskCycle, updateTask } from '../services/taskService';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { scheduleTaskNotification } from '../services/notificationService';
import { addTaskToCalendar } from '../services/calendarService';
import lunarService from '../services/lunarService';

interface TaskDetailProps {
  task: Task;
  onClose: () => void;
  onEdit: () => void;
  onDelete: (taskId: number) => void;
  testID?: string;
  isLoading?: boolean;
}

// 自定义通知弹窗组件
interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

function CustomAlert({ visible, title, message, onClose }: CustomAlertProps) {
  const { colors } = useTheme();
  
  if (!visible) return null;
  
  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.alertOverlay}>
        <View style={[styles.alertContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.alertTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.alertMessage, { color: colors.subText }]}>{message}</Text>
          <TouchableOpacity
            style={[styles.alertButton, { backgroundColor: colors.primary }]}
            onPress={onClose}
          >
            <Text style={styles.alertButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function TaskDetail({
  task,
  onClose,
  onEdit,
  onDelete,
  isLoading = false,
}: TaskDetailProps) {
  const { t, language } = useLanguage();
  const { colors } = useTheme();
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [alertVisible, setAlertVisible] = React.useState(false);
  const [alertTitle, setAlertTitle] = React.useState('');
  const [alertMessage, setAlertMessage] = React.useState('');

  const showCustomAlert = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  const handleDelete = () => {
    Alert.alert(
      t.common.delete,
      t.task.deleteConfirmation,
      [
        {
          text: t.common.cancel,
          style: 'cancel',
        },
        {
          text: t.common.delete,
          style: 'destructive',
          onPress: async () => {
            try {
              setIsProcessing(true);
              await onDelete(task.id);
            } catch (error) {
              console.error('Error deleting task:', error);
              Alert.alert(t.common.error, t.task.deleteFailed);
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleToggleActive = async () => {
    try {
      setIsProcessing(true);
      // 创建更新对象，只更新isActive属性
      await updateTask(task.id, {
        ...task,
        isActive: !task.isActive
      });
      // 显示成功消息
      showCustomAlert(
        t.common.success,
        task.isActive ? t.task.disableTaskSuccess : t.task.enableTaskSuccess
      );
      // 关闭详情页面，返回列表刷新
      onClose();
    } catch (error) {
      console.error('Error toggling task active state:', error);
      Alert.alert(t.common.error, t.task.toggleTaskFailed);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleComplete = async () => {
    if (!task.currentCycle) {
      Alert.alert(t.common.error, t.task.noCycle);
      return;
    }

    try {
      setIsProcessing(true);
      await completeTaskCycle(task.id, task.currentCycle.id);
      Alert.alert(t.common.success, t.task.completeSuccess);
      onClose(); // Close detail view and return to task list
    } catch (error) {
      console.error('Error completing task cycle:', error);
      Alert.alert(t.common.error, t.task.completeFailed);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const solarDate = format(date, 'yyyy-MM-dd HH:mm', { locale: language === 'zh' ? zhCN : undefined });
    if (task.dateType === 'lunar') {
      const lunarDate = lunarService.formatDate(dateString, 'lunar');
      return `${solarDate} (${lunarDate})`;
    }
    return solarDate;
  };

  const getRecurrenceText = (task: Task) => {
    switch (task.recurrenceType) {
      case 'daily':
        return t.task.daily;
      case 'weekly':
        return t.task.weekly;
      case 'monthly':
        return t.task.monthly;
      case 'custom':
        return `${t.task.every} ${task.recurrenceValue} ${getRecurrenceUnitText(task.recurrenceUnit)}`;
      default:
        return t.task.unknown;
    }
  };

  const getRecurrenceUnitText = (unit?: string) => {
    switch (unit) {
      case 'minutes':
        return t.task.minutes;
      case 'hours':
        return t.task.hours;
      case 'days':
        return t.task.days;
      case 'weeks':
        return t.task.weeks;
      case 'months':
        return t.task.months;
      default:
        return '';
    }
  };

  const getReminderText = (task: Task) => {
    return `${t.task.reminderBefore} ${task.reminderOffset} ${getRecurrenceUnitText(task.reminderUnit)}`;
  };

  const handleTestNotification = async (task: Task) => {
    try {
      setIsProcessing(true);
      // 创建一个测试通知，设置为30秒后触发
      const testDate = new Date();
      testDate.setSeconds(testDate.getSeconds() + 30); // 增加到30秒，避免过快过期
      
      // 创建一个模拟的任务周期用于测试
      const testCycle = {
        id: 0,
        taskId: task.id,
        startDate: new Date().toISOString(),
        dueDate: testDate.toISOString(), // 使用testDate作为截止时间
        isCompleted: false,
        isOverdue: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await scheduleTaskNotification(
        {
          ...task,
          title: `${t.task.testNotificationTitle}: ${task.title}`,
          description: task.description || t.task.testNotificationBody
        },
        testCycle
      );
      
      showCustomAlert(
        t.task.testNotificationSuccess,
        t.task.testNotificationMessage
      );
    } catch (error) {
      console.error('Error testing notification:', error);
      Alert.alert(t.common.error, t.task.testNotificationFailed);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTestCalendar = async (task: Task) => {
    try {
      setIsProcessing(true);
      // 创建一个测试日历事件，设置为今天
      const testStartDate = new Date();
      const testEndDate = new Date();
      testEndDate.setHours(testEndDate.getHours() + 1);
      
      // 创建一个模拟的任务周期用于测试
      const testCycle = {
        id: 0,
        taskId: task.id,
        startDate: testStartDate.toISOString(),
        dueDate: testEndDate.toISOString(),
        isCompleted: false,
        isOverdue: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await addTaskToCalendar(
        {
          ...task,
          title: `${t.task.testCalendarTitle}: ${task.title}`,
          description: task.description || t.task.testCalendarNotes
        },
        testCycle
      );
      
      showCustomAlert(
        t.task.testCalendarSuccess,
        t.task.testCalendarMessage
      );
    } catch (error) {
      console.error('Error testing calendar:', error);
      Alert.alert(t.common.error, t.task.testCalendarFailed);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={true}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        {(isProcessing || isLoading) && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
        
        <View
          style={[
            styles.modalView,
            { backgroundColor: colors.card },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text
              style={[
                styles.modalTitle,
                { color: colors.text },
              ]}
            >
              {t.task.details}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons
                name="close"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.contentContainer}>
            <View style={styles.section}>
              <Text
                style={[
                  styles.taskTitle,
                  { color: colors.text },
                ]}
              >
                {task.title}
              </Text>
              {task.description ? (
                <Text
                  style={[
                    styles.taskDescription,
                    { color: colors.text },
                  ]}
                >
                  {task.description}
                </Text>
              ) : null}
            </View>

            <View style={[styles.section, { backgroundColor: colors.background, borderRadius: 8 }]}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: colors.text },
                ]}
              >
                {t.task.recurrenceSettings}
              </Text>
              <View style={styles.infoRow}>
                <Text
                  style={[
                    styles.infoLabel,
                    { color: colors.subText },
                  ]}
                >
                  {t.task.recurrenceType}:
                </Text>
                <Text
                  style={[
                    styles.infoValue,
                    { color: colors.text },
                  ]}
                >
                  {getRecurrenceText(task)}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text
                  style={[
                    styles.infoLabel,
                    { color: colors.subText },
                  ]}
                >
                  {t.task.dateType}:
                </Text>
                <Text
                  style={[
                    styles.infoValue,
                    { color: colors.text },
                  ]}
                >
                  {task.dateType === 'lunar' ? t.task.lunarCalendar : t.task.solarCalendar}
                </Text>
              </View>
            </View>

            {task.currentCycle && (
              <View style={[styles.section, { backgroundColor: colors.background, borderRadius: 8 }]}>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: colors.text },
                  ]}
                >
                  {t.task.currentCycle}
                </Text>
                <View style={styles.infoRow}>
                  <Text
                    style={[
                      styles.infoLabel,
                      { color: colors.subText },
                    ]}
                  >
                    {t.task.startDate}:
                  </Text>
                  <Text
                    style={[
                      styles.infoValue,
                      { color: colors.text },
                    ]}
                  >
                    {formatDate(task.currentCycle.startDate)}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text
                    style={[
                      styles.infoLabel,
                      { color: colors.subText },
                    ]}
                  >
                    {t.task.dueDate}:
                  </Text>
                  <Text
                    style={[
                      styles.infoValue,
                      { color: colors.text },
                    ]}
                  >
                    {formatDate(task.currentCycle.dueDate)}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text
                    style={[
                      styles.infoLabel,
                      { color: colors.subText },
                    ]}
                  >
                    {t.task.status}:
                  </Text>
                  <View style={[
                    styles.statusBadge,
                    { 
                      backgroundColor: task.currentCycle.isCompleted 
                        ? '#4CAF50' 
                        : task.currentCycle.isOverdue 
                          ? '#F44336' 
                          : '#2196F3'
                    }
                  ]}>
                    <Text style={styles.statusText}>
                      {task.currentCycle.isCompleted 
                        ? t.task.statusCompleted 
                        : task.currentCycle.isOverdue 
                          ? t.task.statusOverdue 
                          : t.task.statusInProgress}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            <View style={[styles.section, { backgroundColor: colors.background, borderRadius: 8 }]}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: colors.text },
                ]}
              >
                {t.task.reminderSettings}
              </Text>
              <View style={styles.infoRow}>
                <Text
                  style={[
                    styles.infoLabel,
                    { color: colors.subText },
                  ]}
                >
                  {t.task.reminderTime}:
                </Text>
                <Text
                  style={[
                    styles.infoValue,
                    { color: colors.text },
                  ]}
                >
                  {`${task.reminderTime.hour.toString().padStart(2, '0')}:${task.reminderTime.minute.toString().padStart(2, '0')}`}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text
                  style={[
                    styles.infoLabel,
                    { color: colors.subText },
                  ]}
                >
                  {t.task.reminderOffset}:
                </Text>
                <Text
                  style={[
                    styles.infoValue,
                    { color: colors.text },
                  ]}
                >
                  {`${task.reminderOffset} ${getRecurrenceUnitText(task.reminderUnit)}`}
                </Text>
              </View>
            </View>

            <View style={[styles.section, { backgroundColor: colors.background, borderRadius: 8 }]}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: colors.text },
                ]}
              >
                {t.task.otherSettings}
              </Text>
              <View style={styles.infoRow}>
                <Text
                  style={[
                    styles.infoLabel,
                    { color: colors.subText },
                  ]}
                >
                  {t.task.syncToCalendar}:
                </Text>
                <Text
                  style={[
                    styles.infoValue,
                    { color: colors.text },
                  ]}
                >
                  {task.syncToCalendar ? t.common.yes : t.common.no}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text
                  style={[
                    styles.infoLabel,
                    { color: colors.subText },
                  ]}
                >
                  {t.task.enableTask}:
                </Text>
                <Text
                  style={[
                    styles.infoValue,
                    { color: colors.text },
                  ]}
                >
                  {task.isActive ? t.common.yes : t.common.no}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text
                  style={[
                    styles.infoLabel,
                    { color: colors.subText },
                  ]}
                >
                  {t.task.autoRestart}:
                </Text>
                <Text
                  style={[
                    styles.infoValue,
                    { color: colors.text },
                  ]}
                >
                  {task.autoRestart ? t.common.yes : t.common.no}
                </Text>
              </View>
              {task.lastCompletedDate && (
                <View style={styles.infoRow}>
                  <Text
                    style={[
                      styles.infoLabel,
                      { color: colors.subText },
                    ]}
                  >
                    {t.task.lastCompleted}:
                  </Text>
                  <Text
                    style={[
                      styles.infoValue,
                      { color: colors.text },
                    ]}
                  >
                    {formatDate(task.lastCompletedDate)}
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          <View style={[styles.buttonContainer, { backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: 'rgba(0, 0, 0, 0.1)' }]}>
            {task.currentCycle && !task.currentCycle.isCompleted && (
              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: colors.primary }
                ]}
                onPress={handleComplete}
              >
                <Ionicons name="checkmark-circle" size={20} color="white" />
                <Text style={styles.buttonText}>{t.task.complete}</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: colors.primary }
              ]}
              onPress={onEdit}
            >
              <Ionicons name="create" size={20} color="white" />
              <Text style={styles.buttonText}>{t.common.edit}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: task.isActive ? '#FF9800' : '#4CAF50' }
              ]}
              onPress={handleToggleActive}
            >
              <Ionicons name={task.isActive ? "eye-off" : "eye"} size={20} color="white" />
              <Text style={styles.buttonText}>{task.isActive ? t.task.disableTask : t.task.enableTask}</Text>
            </TouchableOpacity>
            
            <View style={{ flexDirection: 'row', marginBottom: 12 }}>
              <TouchableOpacity
                style={[
                  styles.button,
                  { 
                    backgroundColor: colors.primary, 
                    flex: 1, 
                    marginBottom: 0,
                    marginRight: task.syncToCalendar ? 6 : 0,
                    paddingVertical: 12
                  }
                ]}
                onPress={() => handleTestNotification(task)}
              >
                <Ionicons name="notifications" size={20} color="white" />
                <Text style={[styles.buttonText, { fontSize: 14 }]}>
                  {t.task.testNotification}
                </Text>
              </TouchableOpacity>
              
              {task.syncToCalendar && (
                <TouchableOpacity
                  style={[
                    styles.button,
                    { 
                      backgroundColor: colors.primary, 
                      flex: 1, 
                      marginBottom: 0,
                      marginLeft: 6,
                      paddingVertical: 12
                    }
                  ]}
                  onPress={() => handleTestCalendar(task)}
                >
                  <Ionicons name="calendar" size={20} color="white" />
                  <Text style={[styles.buttonText, { fontSize: 14 }]}>
                    {t.task.testCalendar}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            
            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: colors.error }
              ]}
              onPress={handleDelete}
            >
              <Ionicons name="trash" size={20} color="white" />
              <Text style={styles.buttonText}>{t.common.delete}</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <CustomAlert
          visible={alertVisible}
          title={alertTitle}
          message={alertMessage}
          onClose={() => setAlertVisible(false)}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 0,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalView: {
    width: '90%',
    maxHeight: '80%', // 稍微减小高度，确保在小屏幕上也能居中
    borderRadius: 16,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  section: {
    marginBottom: 20,
    padding: 15,
  },
  taskTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  taskDescription: {
    fontSize: 16,
    marginBottom: 10,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  statusBadge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  statusText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  buttonContainer: {
    marginTop: 0,
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
  },
  button: {
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  // 自定义弹窗样式
  alertOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  alertContainer: {
    width: '80%',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  alertMessage: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  alertButton: {
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  alertButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 