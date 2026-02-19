import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { EmailService } from '../../services/email';
import Logger from '../../utils/logger';
import type { Item } from '../../types/models';

interface SendBoughtListModalProps {
  visible: boolean;
  onClose: () => void;
  boughtItems: Item[];
  listName: string;
  currentUserEmail: string | null;
}

export const SendBoughtListModal: React.FC<SendBoughtListModalProps> = ({
  visible,
  onClose,
  boughtItems,
  listName,
  currentUserEmail,
}) => {
  const { theme } = useTheme();
  const [customEmail, setCustomEmail] = useState('');
  const [sending, setSending] = useState(false);

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSend = async (toEmail: string) => {
    if (!validateEmail(toEmail)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setSending(true);
    try {
      const { error } = await EmailService.sendBoughtList(toEmail, listName, boughtItems);
      if (error) {
        Logger.error('Failed to send bought list:', error);
        Alert.alert('Error', error.message || 'Failed to send email. Please try again.');
      } else {
        Alert.alert('Sent!', `The bought list was sent to ${toEmail}.`, [
          { text: 'OK', onPress: onClose },
        ]);
      }
    } catch (error) {
      Logger.error('Unexpected error sending email:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setSending(false);
    }
  };

  const handleSendToMe = () => {
    if (!currentUserEmail) {
      Alert.alert('No Email', 'Your account email is not available.');
      return;
    }
    handleSend(currentUserEmail);
  };

  const handleSendToCustom = () => {
    handleSend(customEmail.trim());
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton} disabled={sending}>
            <Text style={[styles.headerButtonText, { color: theme.colors.primary }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Send Bought List</Text>
          <View style={styles.headerButton} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Summary */}
          <View style={[styles.summaryCard, { backgroundColor: theme.colors.card }]}>
            <Ionicons name="checkmark-circle" size={24} color={theme.colors.success ?? '#8B8C3C'} />
            <Text style={[styles.summaryText, { color: theme.colors.text }]}>
              {boughtItems.length} bought item{boughtItems.length === 1 ? '' : 's'} from{' '}
              <Text style={{ fontWeight: '700' }}>{listName}</Text>
            </Text>
          </View>

          {/* Send to me */}
          {currentUserEmail && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Send to me</Text>
              <TouchableOpacity
                style={[
                  styles.sendMeButton,
                  {
                    backgroundColor: theme.colors.primary,
                    opacity: sending ? 0.6 : 1,
                  },
                ]}
                onPress={handleSendToMe}
                disabled={sending}
              >
                {sending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="mail" size={18} color="#FFFFFF" style={styles.buttonIcon} />
                    <Text style={styles.sendMeButtonText}>{currentUserEmail}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
            <Text style={[styles.dividerText, { color: theme.colors.textSecondary }]}>or</Text>
            <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
          </View>

          {/* Custom email */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Send to another address
            </Text>
            <View style={styles.customEmailRow}>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.card,
                    color: theme.colors.text,
                    borderColor: theme.colors.border,
                  },
                ]}
                placeholder="Email address"
                placeholderTextColor={theme.colors.textSecondary}
                value={customEmail}
                onChangeText={setCustomEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!sending}
                returnKeyType="send"
                onSubmitEditing={handleSendToCustom}
              />
              <TouchableOpacity
                style={[
                  styles.sendCustomButton,
                  {
                    backgroundColor: theme.colors.primary,
                    opacity: sending || !customEmail.trim() ? 0.5 : 1,
                  },
                ]}
                onPress={handleSendToCustom}
                disabled={sending || !customEmail.trim()}
              >
                {sending ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Ionicons name="send" size={20} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerButton: {
    minWidth: 60,
  },
  headerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 20,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
  },
  summaryText: {
    flex: 1,
    fontSize: 15,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  sendMeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  buttonIcon: {
    marginRight: 2,
  },
  sendMeButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 14,
  },
  customEmailRow: {
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    borderWidth: 1,
  },
  sendCustomButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
