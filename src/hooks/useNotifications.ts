
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { databases, APPWRITE_CONFIG } from '@/integrations/appwrite/client';
import client from '@/integrations/appwrite/client';
import { Query, ID } from 'appwrite';
import { toast } from 'sonner';

export interface Notification {
    $id: string;
    userId: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    link?: string;
    $createdAt: string;
}

export const useNotifications = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const fetchNotifications = async () => {
        if (!user?.$id) return;
        try {
            const res = await databases.listDocuments(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.notifications,
                [
                    Query.equal('userId', user.$id),
                    Query.orderDesc('$createdAt'),
                    Query.limit(20)
                ]
            );
            const fetchedNotifications = res.documents as unknown as Notification[];
            setNotifications(fetchedNotifications);
            setUnreadCount(fetchedNotifications.filter(n => !n.isRead).length);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const markAsRead = async (notificationId: string) => {
        try {
            await databases.updateDocument(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.notifications,
                notificationId,
                { isRead: true }
            );
            setNotifications(prev => 
                prev.map(n => n.$id === notificationId ? { ...n, isRead: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        const unread = notifications.filter(n => !n.isRead);
        try {
            await Promise.all(unread.map(n => 
                databases.updateDocument(
                    APPWRITE_CONFIG.databaseId,
                    APPWRITE_CONFIG.collections.notifications,
                    n.$id,
                    { isRead: true }
                )
            ));
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    };

    const createNotification = async (data: Omit<Notification, '$id' | '$createdAt' | 'isRead'>) => {
        try {
            await databases.createDocument(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collections.notifications,
                ID.unique(),
                {
                    ...data,
                    isRead: false,
                }
            );
        } catch (error) {
            console.error('Failed to create notification:', error);
        }
    };

    useEffect(() => {
        if (!user?.$id) return;

        fetchNotifications();

        const channel = `databases.${APPWRITE_CONFIG.databaseId}.collections.${APPWRITE_CONFIG.collections.notifications}.documents`;
        
        const unsubscribe = client.subscribe(channel, (response) => {
            if (response.events.some(e => e.includes('create'))) {
                const newNotif = response.payload as Notification;
                if (newNotif.userId === user.$id) {
                    setNotifications(prev => [newNotif, ...prev]);
                    setUnreadCount(prev => prev + 1);
                    toast.info(newNotif.title, {
                        description: newNotif.message,
                    });
                }
            } else if (response.events.some(e => e.includes('update'))) {
                const updatedNotif = response.payload as Notification;
                if (updatedNotif.userId === user.$id) {
                    setNotifications(prev => 
                        prev.map(n => n.$id === updatedNotif.$id ? updatedNotif : n)
                    );
                    setUnreadCount(prev => {
                        const oldNotif = notifications.find(n => n.$id === updatedNotif.$id);
                        if (oldNotif && !oldNotif.isRead && updatedNotif.isRead) {
                            return Math.max(0, prev - 1);
                        }
                        return prev;
                    });
                }
            }
        });

        return () => {
            unsubscribe();
        };
    }, [user?.$id]);

    return {
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
        createNotification,
        refresh: fetchNotifications
    };
};
