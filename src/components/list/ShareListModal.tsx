import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { ListsService, ProfilesService } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import Logger from '../../utils/logger';

interface ListMember {
  id: string;
  user_id: string;
  role: 'viewer' | 'editor' | 'owner';
  added_at: string;
  profiles?: {
    email: string | null;
    display_name: string | null;
  };
}

interface ShareListModalProps {
  visible: boolean;
  onClose: () => void;
  listId: string;
  currentUserRole: 'viewer' | 'editor' | 'owner';
}

export const ShareListModal: React.FC<ShareListModalProps> = ({
  visible,
  onClose,
  listId,
  currentUserRole,
}) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [members, setMembers] = useState<ListMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingMember, setAddingMember] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'viewer' | 'editor'>('editor');

  // Load members when modal opens
  useEffect(() => {
    if (visible) {
      loadMembers();
    }
  }, [visible, listId]);

  const loadMembers = async () => {
    setLoading(true);
    const { data, error } = await ListsService.getListMembers(listId);

    if (error) {
      Logger.error('Error loading list members:', error);
      Alert.alert('Error', 'Failed to load list members');
      setMembers([]);
    } else {
      setMembers((data as ListMember[]) || []);
    }

    setLoading(false);
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleAddMember = async () => {
    // Validate email format
    if (!newMemberEmail.trim()) {
      Alert.alert('Invalid Email', 'Please enter an email address');
      return;
    }

    if (!validateEmail(newMemberEmail.trim())) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    setAddingMember(true);

    try {
      // Look up user by email
      const { data: profile, error: profileError } = await ProfilesService.getUserByEmail(
        newMemberEmail.trim()
      );

      if (profileError || !profile) {
        Alert.alert('User Not Found', 'No user found with this email address');
        setAddingMember(false);
        return;
      }

      // Check if user is already a member
      if (members.some((member) => member.user_id === profile.id)) {
        Alert.alert('Already a Member', 'This user is already a member of this list');
        setAddingMember(false);
        return;
      }

      // Add member to list
      const { error: addError } = await ListsService.addListMember(
        listId,
        profile.id,
        newMemberRole
      );

      if (addError) {
        Logger.error('Error adding member:', addError);
        Alert.alert('Error', 'Failed to add member. Please try again.');
        setAddingMember(false);
        return;
      }

      // Success - clear input and reload members
      setNewMemberEmail('');
      setNewMemberRole('editor');
      await loadMembers();
      Alert.alert('Success', 'Member added successfully!');
    } catch (error) {
      Logger.error('Failed to add member:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    }

    setAddingMember(false);
  };

  const handleRemoveMember = async (userId: string, memberName: string) => {
    // Count current owners
    const ownerCount = members.filter((m) => m.role === 'owner').length;
    const memberToRemove = members.find((m) => m.user_id === userId);

    // Prevent removing last owner
    if (memberToRemove?.role === 'owner' && ownerCount === 1) {
      Alert.alert(
        'Cannot Remove Owner',
        'Cannot remove the last owner of the list. Promote another member to owner first.'
      );
      return;
    }

    // Show confirmation dialog
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${memberName} from this list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const { error } = await ListsService.removeListMember(listId, userId);

            if (error) {
              Logger.error('Error removing member:', error);
              Alert.alert('Error', 'Failed to remove member');
              return;
            }

            await loadMembers();

            // If user removed themselves, close modal and navigate away
            if (userId === user?.id) {
              Alert.alert('Removed', 'You have been removed from this list');
              onClose();
            }
          },
        },
      ]
    );
  };

  const handleChangeRole = async (userId: string, currentRole: string, newRole: 'viewer' | 'editor' | 'owner') => {
    // Count current owners
    const ownerCount = members.filter((m) => m.role === 'owner').length;

    // Prevent demoting last owner
    if (currentRole === 'owner' && ownerCount === 1 && newRole !== 'owner') {
      Alert.alert(
        'Cannot Change Role',
        'Cannot demote the last owner of the list. Promote another member to owner first.'
      );
      return;
    }

    // Warn when promoting to owner
    if (newRole === 'owner') {
      Alert.alert(
        'Promote to Owner',
        'Owners have full control over the list, including managing members and deleting the list. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Promote',
            onPress: async () => {
              await updateMemberRole(userId, newRole);
            },
          },
        ]
      );
      return;
    }

    await updateMemberRole(userId, newRole);
  };

  const updateMemberRole = async (userId: string, newRole: 'viewer' | 'editor' | 'owner') => {
    const { error } = await ListsService.updateMemberRole(listId, userId, newRole);

    if (error) {
      Logger.error('Error updating member role:', error);
      Alert.alert('Error', 'Failed to update member role');
      return;
    }

    await loadMembers();
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return '👑';
      case 'editor':
        return '✏️';
      case 'viewer':
        return '👁️';
      default:
        return '•';
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return theme.colors.primary;
      case 'editor':
        return '#10b981'; // green
      case 'viewer':
        return theme.colors.textSecondary;
      default:
        return theme.colors.border;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  };

  const isOwner = currentUserRole === 'owner';

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
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Text style={[styles.headerButtonText, { color: theme.colors.primary }]}>
              Cancel
            </Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Share List</Text>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Text style={[styles.headerButtonText, { color: theme.colors.primary }]}>Done</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Add Member Section (only for owners) */}
          {isOwner && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Add Member
              </Text>
              <View style={styles.addMemberForm}>
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
                  value={newMemberEmail}
                  onChangeText={setNewMemberEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!addingMember}
                />

                <View style={styles.rolePickerContainer}>
                  <Text style={[styles.rolePickerLabel, { color: theme.colors.textSecondary }]}>
                    Role:
                  </Text>
                  <View style={styles.rolePicker}>
                    <TouchableOpacity
                      style={[
                        styles.roleOption,
                        {
                          backgroundColor:
                            newMemberRole === 'viewer'
                              ? theme.colors.primary + '20'
                              : 'transparent',
                          borderColor: theme.colors.border,
                        },
                      ]}
                      onPress={() => setNewMemberRole('viewer')}
                      disabled={addingMember}
                    >
                      <Text
                        style={[
                          styles.roleOptionText,
                          {
                            color:
                              newMemberRole === 'viewer'
                                ? theme.colors.primary
                                : theme.colors.text,
                          },
                        ]}
                      >
                        👁️ Viewer
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.roleOption,
                        {
                          backgroundColor:
                            newMemberRole === 'editor'
                              ? theme.colors.primary + '20'
                              : 'transparent',
                          borderColor: theme.colors.border,
                        },
                      ]}
                      onPress={() => setNewMemberRole('editor')}
                      disabled={addingMember}
                    >
                      <Text
                        style={[
                          styles.roleOptionText,
                          {
                            color:
                              newMemberRole === 'editor'
                                ? theme.colors.primary
                                : theme.colors.text,
                          },
                        ]}
                      >
                        ✏️ Editor
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.addButton,
                    {
                      backgroundColor: theme.colors.primary,
                      opacity: addingMember ? 0.6 : 1,
                    },
                  ]}
                  onPress={handleAddMember}
                  disabled={addingMember}
                >
                  {addingMember ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.addButtonText}>Add Member</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Current Members Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Members ({members.length})
            </Text>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
              </View>
            ) : members.length === 0 ? (
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                No members found
              </Text>
            ) : (
              <View style={styles.membersList}>
                {members.map((member) => {
                  const isCurrentUser = member.user_id === user?.id;
                  const memberName =
                    member.profiles?.display_name || member.profiles?.email || 'Unknown User';

                  return (
                    <View
                      key={member.id}
                      style={[
                        styles.memberRow,
                        { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                      ]}
                    >
                      <View style={styles.memberInfo}>
                        <View style={styles.memberHeader}>
                          <Text style={[styles.memberName, { color: theme.colors.text }]}>
                            {memberName}
                            {isCurrentUser && (
                              <Text
                                style={[
                                  styles.youBadge,
                                  { color: theme.colors.textSecondary },
                                ]}
                              >
                                {' '}
                                (You)
                              </Text>
                            )}
                          </Text>
                        </View>
                        {member.profiles?.email && member.profiles.email !== memberName && (
                          <Text style={[styles.memberEmail, { color: theme.colors.textSecondary }]}>
                            {member.profiles.email}
                          </Text>
                        )}
                        <Text style={[styles.memberDate, { color: theme.colors.textTertiary }]}>
                          Joined {formatDate(member.added_at)}
                        </Text>
                      </View>

                      <View style={styles.memberActions}>
                        <View
                          style={[
                            styles.roleBadge,
                            { backgroundColor: getRoleBadgeColor(member.role) + '20' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.roleBadgeText,
                              { color: getRoleBadgeColor(member.role) },
                            ]}
                          >
                            {getRoleIcon(member.role)} {member.role}
                          </Text>
                        </View>

                        {/* Action buttons (only for owners and not for current user) */}
                        {isOwner && !isCurrentUser && (
                          <View style={styles.actionButtons}>
                            <TouchableOpacity
                              onPress={() => {
                                Alert.alert('Change Role', 'Select new role', [
                                  { text: 'Cancel', style: 'cancel' },
                                  {
                                    text: '👁️ Viewer',
                                    onPress: () =>
                                      handleChangeRole(member.user_id, member.role, 'viewer'),
                                  },
                                  {
                                    text: '✏️ Editor',
                                    onPress: () =>
                                      handleChangeRole(member.user_id, member.role, 'editor'),
                                  },
                                  {
                                    text: '👑 Owner',
                                    onPress: () =>
                                      handleChangeRole(member.user_id, member.role, 'owner'),
                                  },
                                ]);
                              }}
                              style={styles.actionButton}
                            >
                              <Ionicons
                                name="swap-horizontal"
                                size={20}
                                color={theme.colors.primary}
                              />
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => handleRemoveMember(member.user_id, memberName)}
                              style={styles.actionButton}
                            >
                              <Ionicons name="trash-outline" size={20} color="#ef4444" />
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* Role Info Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Role Info</Text>
            <View style={[styles.infoCard, { backgroundColor: theme.colors.card }]}>
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>👑</Text>
                <View style={styles.infoText}>
                  <Text style={[styles.infoTitle, { color: theme.colors.text }]}>Owner</Text>
                  <Text style={[styles.infoDescription, { color: theme.colors.textSecondary }]}>
                    Full control: manage items, members, and settings
                  </Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>✏️</Text>
                <View style={styles.infoText}>
                  <Text style={[styles.infoTitle, { color: theme.colors.text }]}>Editor</Text>
                  <Text style={[styles.infoDescription, { color: theme.colors.textSecondary }]}>
                    Can add, edit, and remove items
                  </Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>👁️</Text>
                <View style={styles.infoText}>
                  <Text style={[styles.infoTitle, { color: theme.colors.text }]}>Viewer</Text>
                  <Text style={[styles.infoDescription, { color: theme.colors.textSecondary }]}>
                    Can only view items (read-only)
                  </Text>
                </View>
              </View>
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
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  addMemberForm: {
    gap: 12,
  },
  input: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  rolePickerContainer: {
    gap: 8,
  },
  rolePickerLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  rolePicker: {
    flexDirection: 'row',
    gap: 8,
  },
  roleOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  roleOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  addButton: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    padding: 24,
  },
  membersList: {
    gap: 8,
  },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  memberInfo: {
    flex: 1,
    marginRight: 12,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
  },
  youBadge: {
    fontSize: 14,
    fontWeight: '400',
  },
  memberEmail: {
    fontSize: 14,
    marginBottom: 2,
  },
  memberDate: {
    fontSize: 12,
  },
  memberActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoIcon: {
    fontSize: 24,
  },
  infoText: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  infoDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
});
