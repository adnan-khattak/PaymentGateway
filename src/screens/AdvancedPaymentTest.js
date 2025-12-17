import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Button,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
  Image
} from 'react-native';
import Purchases from 'react-native-purchases';

// Your RevenueCat Configuration
const ENTITLEMENT_ID = 'premium'; // Your entitlement identifier
const OFFERING_ID = 'default'; // Your offering identifier

// Sample images (using placeholder images)
const SAMPLE_IMAGES = [
  { id: 1, url: 'https://picsum.photos/seed/img1/300/200', title: 'Beautiful Sunset', free: true },
  { id: 2, url: 'https://picsum.photos/seed/img2/300/200', title: 'Mountain View', free: true },
  { id: 3, url: 'https://picsum.photos/seed/img3/300/200', title: 'Ocean Waves', free: false },
  { id: 4, url: 'https://picsum.photos/seed/img4/300/200', title: 'City Lights', free: false },
  { id: 5, url: 'https://picsum.photos/seed/img5/300/200', title: 'Forest Path', free: false },
];

const AdvancedPaymentTest = () => {
  const [offerings, setOfferings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [entitlements, setEntitlements] = useState({});
  const [isPremium, setIsPremium] = useState(false); // Quick premium check
  const [subscriptionStatus, setSubscriptionStatus] = useState(null); // Detailed subscription info

  useEffect(() => {
    initializePurchases();
    
    // Clean up listener on unmount
    return () => {
      // RevenueCat handles cleanup internally
    };
  }, []);

  const initializePurchases = async () => {
    try {
      // Initialize RevenueCat
      Purchases.configure({ apiKey: 'test_zLWxqaPyXMVfwFzSHmLVcnEZPjz' });

      // Set up listener for customer info updates
      // This fires when: purchase, restore, renewal, cancellation, expiration
      Purchases.addCustomerInfoUpdateListener((info) => {
        console.log('🔄 Customer info updated:', info);
        updateCustomerState(info);
        
        // Check for subscription changes
        checkSubscriptionLifecycle(info);
      });

      // Fetch initial data
      await Promise.all([
        fetchOfferings(),
        fetchCustomerInfo()
      ]);
    } catch (e) {
      console.error('Initialization error:', e);
      Alert.alert('Error', 'Failed to initialize purchases');
    } finally {
      setLoading(false);
    }
  };

  // Fetch available offerings
  const fetchOfferings = async () => {
    try {
      const fetchedOfferings = await Purchases.getOfferings();
      
      console.log('📦 All Offerings:', fetchedOfferings);
      
      // Get your specific "default" offering or fall back to current
      const targetOffering = fetchedOfferings.all[OFFERING_ID] || fetchedOfferings.current;
      
      if (targetOffering?.availablePackages.length > 0) {
        setOfferings(targetOffering.availablePackages);
        console.log('✅ Offerings loaded:', targetOffering.availablePackages.length);
        
        // Log each product for debugging
        targetOffering.availablePackages.forEach((pkg) => {
          console.log(`📱 Product: ${pkg.product.identifier}`);
          console.log(`   Title: ${pkg.product.title}`);
          console.log(`   Price: ${pkg.product.priceString}`);
          console.log(`   Package Type: ${pkg.packageType}`);
        });
      } else {
        console.log('⚠️ No offerings available');
      }
    } catch (e) {
      console.error('Error fetching offerings:', e);
    }
  };

  // Fetch customer info and entitlements
  const fetchCustomerInfo = async () => {
    try {
      const info = await Purchases.getCustomerInfo();
      updateCustomerState(info);
    } catch (e) {
      console.error('Error fetching customer info:', e);
    }
  };

  // Update local state with customer info
  const updateCustomerState = (info) => {
    setCustomerInfo(info);
    setEntitlements(info.entitlements.active);
    
    // Check if user has premium entitlement
    const hasPremium = info.entitlements.active[ENTITLEMENT_ID] !== undefined;
    setIsPremium(hasPremium);
    
    console.log('Active entitlements:', Object.keys(info.entitlements.active));
    console.log('Has Premium:', hasPremium);
    
    // Log premium entitlement details if active
    if (hasPremium) {
      const premiumEntitlement = info.entitlements.active[ENTITLEMENT_ID];
      console.log('Premium Details:', {
        productIdentifier: premiumEntitlement.productIdentifier,
        expirationDate: premiumEntitlement.expirationDate,
        willRenew: premiumEntitlement.willRenew,
        isActive: premiumEntitlement.isActive,
      });
    }
    
    // Analyze and update subscription status
    analyzeSubscriptionStatus(info);
  };

  // ============================================
  // SUBSCRIPTION LIFECYCLE MANAGEMENT
  // ============================================

  // Analyze subscription status in detail
  const analyzeSubscriptionStatus = (info) => {
    const premiumEntitlement = info.entitlements.active[ENTITLEMENT_ID];
    
    if (!premiumEntitlement) {
      // Check if user ever had a subscription
      const allEntitlements = info.entitlements.all[ENTITLEMENT_ID];
      
      if (allEntitlements) {
        // User had subscription before but it's no longer active
        setSubscriptionStatus({
          status: 'expired',
          message: 'Your subscription has expired',
          expirationDate: allEntitlements.expirationDate,
          productId: allEntitlements.productIdentifier,
        });
      } else {
        // Never subscribed
        setSubscriptionStatus({
          status: 'none',
          message: 'No active subscription',
        });
      }
      return;
    }

    // Has active entitlement - check details
    const now = new Date();
    const expirationDate = premiumEntitlement.expirationDate 
      ? new Date(premiumEntitlement.expirationDate) 
      : null;
    
    // Calculate time until expiration
    const timeUntilExpiry = expirationDate ? expirationDate - now : null;
    const daysUntilExpiry = timeUntilExpiry ? Math.ceil(timeUntilExpiry / (1000 * 60 * 60 * 24)) : null;
    
    // Determine status based on willRenew and time remaining
    let status = 'active';
    let message = 'Your subscription is active';

    if (!premiumEntitlement.willRenew) {
      // User cancelled but still has access until expiration
      status = 'cancelled';
      message = `Cancelled - Access until ${expirationDate?.toLocaleDateString()}`;
    } else if (daysUntilExpiry !== null && daysUntilExpiry <= 3) {
      // Renewing soon
      status = 'renewing_soon';
      message = `Renews in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}`;
    } else if (premiumEntitlement.periodType === 'trial') {
      // On free trial
      status = 'trial';
      message = `Free trial - ${daysUntilExpiry} days remaining`;
    }

    setSubscriptionStatus({
      status,
      message,
      willRenew: premiumEntitlement.willRenew,
      expirationDate: premiumEntitlement.expirationDate,
      productId: premiumEntitlement.productIdentifier,
      periodType: premiumEntitlement.periodType,
      daysUntilExpiry,
      // Billing issue detection
      billingIssue: premiumEntitlement.billingIssueDetectedAt !== null,
      billingIssueDate: premiumEntitlement.billingIssueDetectedAt,
    });
  };

  // Check for subscription lifecycle events (called when customerInfo updates)
  const checkSubscriptionLifecycle = (newInfo) => {
    if (!customerInfo) return; // No previous state to compare
    
    const previousPremium = customerInfo.entitlements.active[ENTITLEMENT_ID];
    const currentPremium = newInfo.entitlements.active[ENTITLEMENT_ID];
    
    // Detect subscription events
    if (!previousPremium && currentPremium) {
      // NEW SUBSCRIPTION or RENEWAL after expiration
      console.log('🎉 New subscription activated!');
      handleSubscriptionActivated(currentPremium);
    } 
    else if (previousPremium && !currentPremium) {
      // SUBSCRIPTION EXPIRED
      console.log('⏰ Subscription expired!');
      handleSubscriptionExpired();
    }
    else if (previousPremium && currentPremium) {
      // Check for changes in active subscription
      if (previousPremium.willRenew && !currentPremium.willRenew) {
        // USER CANCELLED (but still has access)
        console.log('❌ User cancelled subscription');
        handleSubscriptionCancelled(currentPremium);
      }
      else if (!previousPremium.willRenew && currentPremium.willRenew) {
        // USER RESUBSCRIBED / REACTIVATED
        console.log('🔄 Subscription reactivated!');
        handleSubscriptionReactivated(currentPremium);
      }
      else if (previousPremium.expirationDate !== currentPremium.expirationDate) {
        // SUBSCRIPTION RENEWED
        console.log('✅ Subscription renewed!');
        handleSubscriptionRenewed(currentPremium);
      }
      
      // Check for billing issues
      if (!previousPremium.billingIssueDetectedAt && currentPremium.billingIssueDetectedAt) {
        console.log('⚠️ Billing issue detected!');
        handleBillingIssue(currentPremium);
      }
    }
  };

  // Handle new subscription
  const handleSubscriptionActivated = (entitlement) => {
    Alert.alert(
      '🎉 Welcome to Premium!',
      `Thank you for subscribing!\n\nYour subscription is now active until ${new Date(entitlement.expirationDate).toLocaleDateString()}.`,
      [{ text: 'Awesome!', style: 'default' }]
    );
  };

  // Handle subscription expiration
  const handleSubscriptionExpired = () => {
    Alert.alert(
      '⏰ Subscription Expired',
      'Your premium access has ended. Subscribe again to continue enjoying premium features!',
      [
        { text: 'Maybe Later', style: 'cancel' },
        { text: 'Resubscribe', onPress: () => console.log('Show offerings') }
      ]
    );
  };

  // Handle cancellation (user still has access until expiry)
  const handleSubscriptionCancelled = (entitlement) => {
    const expiryDate = new Date(entitlement.expirationDate).toLocaleDateString();
    Alert.alert(
      '😢 Subscription Cancelled',
      `We're sorry to see you go!\n\nYou'll still have access until ${expiryDate}. You can resubscribe anytime before then to keep your premium benefits.`,
      [{ text: 'OK', style: 'default' }]
    );
  };

  // Handle reactivation
  const handleSubscriptionReactivated = (entitlement) => {
    Alert.alert(
      '🎉 Welcome Back!',
      'Your subscription has been reactivated. Enjoy your premium features!',
      [{ text: 'Great!', style: 'default' }]
    );
  };

  // Handle successful renewal
  const handleSubscriptionRenewed = (entitlement) => {
    console.log('Subscription renewed until:', entitlement.expirationDate);
    // Usually silent - maybe show a small toast
  };

  // Handle billing issue
  const handleBillingIssue = (entitlement) => {
    Alert.alert(
      '⚠️ Payment Issue',
      'There was a problem processing your subscription payment. Please update your payment method to avoid losing access.',
      [
        { text: 'Later', style: 'cancel' },
        { text: 'Update Payment', onPress: () => openManageSubscriptions() }
      ]
    );
  };

  // Open platform subscription management
  const openManageSubscriptions = async () => {
    try {
      const info = await Purchases.getCustomerInfo();
      const managementURL = info.managementURL;
      
      // Get current subscription details for display
      const premiumEntitlement = info.entitlements.active[ENTITLEMENT_ID];
      const activeSubscriptions = Object.keys(info.activeSubscriptions);
      
      // Build subscription info message
      let subscriptionInfo = '';
      if (premiumEntitlement) {
        subscriptionInfo = `\n\n📦 Product: ${premiumEntitlement.productIdentifier}\n`;
        subscriptionInfo += `📅 Expires: ${premiumEntitlement.expirationDate ? new Date(premiumEntitlement.expirationDate).toLocaleDateString() : 'Never'}\n`;
        subscriptionInfo += `🔄 Will Renew: ${premiumEntitlement.willRenew ? 'Yes' : 'No'}`;
      }

      if (managementURL) {
        // Has management URL - can open native management
        Alert.alert(
          '⚙️ Manage Subscription',
          `Your subscription details:${subscriptionInfo}\n\nOpen subscription settings to cancel, change plan, or update payment method.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Open Settings', 
              onPress: async () => {
                try {
                  const { Linking } = require('react-native');
                  await Linking.openURL(managementURL);
                } catch (linkError) {
                  Alert.alert('Error', 'Could not open subscription settings. URL: ' + managementURL);
                }
              }
            }
          ]
        );
      } else {
        // No management URL (common in sandbox/test mode)
        // Show manual instructions based on platform
        const { Platform } = require('react-native');
        
        if (Platform.OS === 'ios') {
          Alert.alert(
            '⚙️ Manage Subscription',
            `Your subscription details:${subscriptionInfo}\n\n📱 To manage on iOS:\n1. Open Settings app\n2. Tap your name at the top\n3. Tap "Subscriptions"\n4. Find and tap this app\n\n⚠️ Note: In sandbox/test mode, management URL may not be available.`,
            [
              { text: 'OK', style: 'default' },
              {
                text: 'Open Settings',
                onPress: async () => {
                  try {
                    const { Linking } = require('react-native');
                    // Try to open iOS subscription settings directly
                    await Linking.openURL('https://apps.apple.com/account/subscriptions');
                  } catch (e) {
                    console.log('Could not open settings:', e);
                  }
                }
              }
            ]
          );
        } else {
          // Android
          Alert.alert(
            '⚙️ Manage Subscription',
            `Your subscription details:${subscriptionInfo}\n\n📱 To manage on Android:\n1. Open Google Play Store\n2. Tap Menu → Subscriptions\n3. Find and tap this app\n\n⚠️ Note: In sandbox/test mode, management URL may not be available.`,
            [
              { text: 'OK', style: 'default' },
              {
                text: 'Open Play Store',
                onPress: async () => {
                  try {
                    const { Linking } = require('react-native');
                    // Try to open Google Play subscriptions
                    await Linking.openURL('https://play.google.com/store/account/subscriptions');
                  } catch (e) {
                    console.log('Could not open Play Store:', e);
                  }
                }
              }
            ]
          );
        }
      }
    } catch (e) {
      console.error('Error opening management:', e);
      Alert.alert('Error', 'Could not load subscription info: ' + e.message);
    }
  };

  // ============================================
  // END SUBSCRIPTION LIFECYCLE MANAGEMENT
  // ============================================

  // Purchase a package
  const purchasePackage = async (selectedPackage) => {
    try {
      Alert.alert(
        'Test Purchase',
        `About to purchase: ${selectedPackage.product.title}`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Continue',
            onPress: async () => {
              try {
                const { customerInfo: updatedInfo } = await Purchases.purchasePackage(selectedPackage);
                updateCustomerState(updatedInfo);
                
                Alert.alert(
                  '✅ Purchase Successful!',
                  `You now have access to: ${Object.keys(updatedInfo.entitlements.active).join(', ')}`
                );
              } catch (purchaseError) {
                if (!purchaseError.userCancelled) {
                  Alert.alert('Purchase Failed', purchaseError.message);
                }
              }
            }
          }
        ]
      );
    } catch (e) {
      console.error('Purchase error:', e);
    }
  };

  // Restore purchases (useful for testing)
  const restorePurchases = async () => {
    try {
      const restoredInfo = await Purchases.restorePurchases();
      updateCustomerState(restoredInfo);
      
      Alert.alert(
        'Restore Complete',
        `Active entitlements: ${Object.keys(restoredInfo.entitlements.active).length}`
      );
    } catch (e) {
      Alert.alert('Restore Failed', e.message);
    }
  };

  // Get user ID (useful for debugging)
  const showCustomerID = async () => {
    try {
      const appUserID = await Purchases.getAppUserID();
      Alert.alert('Your Customer ID', appUserID);
    } catch (e) {
      console.error('Error getting user ID:', e);
    }
  };

  // Check specific entitlement
  const checkEntitlement = (entitlementId) => {
    return entitlements[entitlementId] !== undefined;
  };

  // Render entitlement status
  const renderEntitlementStatus = () => {
    const activeEntitlementsList = Object.keys(entitlements);
    
    if (!isPremium) {
      return (
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>🔒 Free User</Text>
          <Text style={styles.statusSubtitle}>Purchase a subscription to unlock premium features</Text>
          <View style={styles.featureList}>
            <Text style={styles.featureItem}>❌ Premium Feature 1</Text>
            <Text style={styles.featureItem}>❌ Premium Feature 2</Text>
            <Text style={styles.featureItem}>❌ Ad-free Experience</Text>
          </View>
        </View>
      );
    }

    const premiumEntitlement = entitlements[ENTITLEMENT_ID];
    
    return (
      <View style={[styles.statusCard, styles.premiumCard]}>
        <Text style={styles.statusTitle}>👑 Premium User</Text>
        <Text style={styles.statusSubtitle}>You have full access!</Text>
        
        <View style={styles.featureList}>
          <Text style={styles.featureItem}>✅ Premium Feature 1</Text>
          <Text style={styles.featureItem}>✅ Premium Feature 2</Text>
          <Text style={styles.featureItem}>✅ Ad-free Experience</Text>
        </View>
        
        <View style={styles.subscriptionDetails}>
          <Text style={styles.detailLabel}>Product:</Text>
          <Text style={styles.detailValue}>{premiumEntitlement?.productIdentifier}</Text>
          
          <Text style={styles.detailLabel}>Expires:</Text>
          <Text style={styles.detailValue}>
            {premiumEntitlement?.expirationDate 
              ? new Date(premiumEntitlement.expirationDate).toLocaleDateString()
              : 'Never'}
          </Text>
          
          <Text style={styles.detailLabel}>Will Renew:</Text>
          <Text style={styles.detailValue}>
            {premiumEntitlement?.willRenew ? '✅ Yes' : '❌ No'}
          </Text>
        </View>
      </View>
    );
  };

  // Render customer info
  const renderCustomerInfo = () => {
    if (!customerInfo) return null;

    return (
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Customer Info</Text>
        <Text style={styles.infoText}>
          Original App User ID: {customerInfo.originalAppUserId}
        </Text>
        <Text style={styles.infoText}>
          Active Subscriptions: {Object.keys(customerInfo.activeSubscriptions).length}
        </Text>
        <Text style={styles.infoText}>
          All Purchases: {Object.keys(customerInfo.allPurchasedProductIdentifiers).length}
        </Text>
      </View>
    );
  };

  // Render subscription lifecycle status card
  const renderSubscriptionStatus = () => {
    if (!subscriptionStatus) return null;

    const getStatusColor = () => {
      switch (subscriptionStatus.status) {
        case 'active': return '#4CAF50';
        case 'trial': return '#2196F3';
        case 'renewing_soon': return '#FF9800';
        case 'cancelled': return '#FF5722';
        case 'expired': return '#F44336';
        default: return '#9E9E9E';
      }
    };

    const getStatusIcon = () => {
      switch (subscriptionStatus.status) {
        case 'active': return '✅';
        case 'trial': return '🎁';
        case 'renewing_soon': return '🔄';
        case 'cancelled': return '⚠️';
        case 'expired': return '❌';
        default: return '📋';
      }
    };

    return (
      <View style={[styles.subscriptionStatusCard, { borderLeftColor: getStatusColor() }]}>
        <View style={styles.statusHeader}>
          <Text style={styles.statusIcon}>{getStatusIcon()}</Text>
          <View style={styles.statusInfo}>
            <Text style={[styles.statusLabel, { color: getStatusColor() }]}>
              {subscriptionStatus.status.toUpperCase().replace('_', ' ')}
            </Text>
            <Text style={styles.statusMessage}>{subscriptionStatus.message}</Text>
          </View>
        </View>

        {/* Subscription Details */}
        {subscriptionStatus.productId && (
          <View style={styles.statusDetails}>
            <View style={styles.statusRow}>
              <Text style={styles.statusDetailLabel}>Product:</Text>
              <Text style={styles.statusDetailValue}>{subscriptionStatus.productId}</Text>
            </View>
            
            {subscriptionStatus.expirationDate && (
              <View style={styles.statusRow}>
                <Text style={styles.statusDetailLabel}>
                  {subscriptionStatus.status === 'cancelled' ? 'Access Until:' : 'Expires:'}
                </Text>
                <Text style={styles.statusDetailValue}>
                  {new Date(subscriptionStatus.expirationDate).toLocaleDateString()}
                </Text>
              </View>
            )}
            
            {subscriptionStatus.daysUntilExpiry !== null && (
              <View style={styles.statusRow}>
                <Text style={styles.statusDetailLabel}>Days Left:</Text>
                <Text style={[
                  styles.statusDetailValue,
                  subscriptionStatus.daysUntilExpiry <= 3 && styles.warningText
                ]}>
                  {subscriptionStatus.daysUntilExpiry}
                </Text>
              </View>
            )}

            {subscriptionStatus.willRenew !== undefined && (
              <View style={styles.statusRow}>
                <Text style={styles.statusDetailLabel}>Auto-Renew:</Text>
                <Text style={[
                  styles.statusDetailValue,
                  { color: subscriptionStatus.willRenew ? '#4CAF50' : '#F44336' }
                ]}>
                  {subscriptionStatus.willRenew ? 'ON' : 'OFF'}
                </Text>
              </View>
            )}

            {/* Billing Issue Warning */}
            {subscriptionStatus.billingIssue && (
              <View style={styles.billingWarning}>
                <Text style={styles.billingWarningText}>
                  ⚠️ Payment issue detected! Please update your payment method.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Action Buttons based on status */}
        <View style={styles.statusActions}>
          {subscriptionStatus.status === 'cancelled' && (
            <TouchableOpacity 
              style={styles.resubscribeButton}
              onPress={() => Alert.alert('Resubscribe', 'Scroll down to see subscription options')}
            >
              <Text style={styles.resubscribeButtonText}>Resubscribe</Text>
            </TouchableOpacity>
          )}
          
          {subscriptionStatus.status === 'expired' && (
            <TouchableOpacity 
              style={styles.resubscribeButton}
              onPress={() => Alert.alert('Subscribe Again', 'Scroll down to see subscription options')}
            >
              <Text style={styles.resubscribeButtonText}>Subscribe Again</Text>
            </TouchableOpacity>
          )}

          {(subscriptionStatus.status === 'active' || subscriptionStatus.status === 'cancelled') && (
            <TouchableOpacity 
              style={styles.manageButton}
              onPress={openManageSubscriptions}
            >
              <Text style={styles.manageButtonText}>Manage Subscription</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // Handle locked image press
  const handleLockedImagePress = () => {
    Alert.alert(
      '🔒 Premium Content',
      'Subscribe to unlock all images and premium features!',
      [
        { text: 'Maybe Later', style: 'cancel' },
        { 
          text: 'View Plans', 
          onPress: () => {
            // Scroll to offerings section or show paywall
            Alert.alert('Scroll down to see subscription options');
          }
        }
      ]
    );
  };

  // Render image gallery
  const renderImageGallery = () => {
    return (
      <View style={styles.galleryContainer}>
        <Text style={styles.sectionTitle}>📸 Image Gallery</Text>
        <Text style={styles.gallerySubtitle}>
          {isPremium 
            ? '👑 Premium: All 5 images unlocked!' 
            : '🔒 Free: 2 of 5 images available'}
        </Text>
        
        <View style={styles.imageGrid}>
          {SAMPLE_IMAGES.map((image) => {
            const isLocked = !image.free && !isPremium;
            
            return (
              <TouchableOpacity
                key={image.id}
                style={styles.imageCard}
                onPress={() => {
                  if (isLocked) {
                    handleLockedImagePress();
                  } else {
                    Alert.alert('Image Opened', `Viewing: ${image.title}`);
                  }
                }}
                activeOpacity={0.8}
              >
                {isLocked ? (
                  // Locked image view
                  <View style={styles.lockedImageContainer}>
                    <View style={styles.blurredImage}>
                      <Text style={styles.lockIcon}>🔒</Text>
                      <Text style={styles.lockText}>Premium</Text>
                    </View>
                    <View style={styles.imageOverlay}>
                      <Text style={styles.unlockText}>Subscribe to Unlock</Text>
                    </View>
                  </View>
                ) : (
                  // Unlocked image view
                  <View style={styles.unlockedImageContainer}>
                    <Image
                      source={{ uri: image.url }}
                      style={styles.galleryImage}
                      resizeMode="cover"
                    />
                    {image.free && !isPremium && (
                      <View style={styles.freeBadge}>
                        <Text style={styles.freeBadgeText}>FREE</Text>
                      </View>
                    )}
                    {isPremium && (
                      <View style={styles.premiumBadge}>
                        <Text style={styles.premiumBadgeText}>👑</Text>
                      </View>
                    )}
                  </View>
                )}
                <Text style={styles.imageTitle} numberOfLines={1}>
                  {isLocked ? '???' : image.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        
        {!isPremium && (
          <View style={styles.upgradePrompt}>
            <Text style={styles.upgradeText}>
              🎁 Subscribe now to unlock 3 more premium images!
            </Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading RevenueCat...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>RevenueCat Test Store</Text>

      {/* Entitlement Status */}
      {renderEntitlementStatus()}

      {/* Subscription Lifecycle Status */}
      {renderSubscriptionStatus()}

      {/* Image Gallery - Premium Content Demo */}
      {renderImageGallery()}

      {/* Customer Info */}
      {renderCustomerInfo()}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={restorePurchases}>
          <Text style={styles.actionButtonText}>🔄 Restore Purchases</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={showCustomerID}>
          <Text style={styles.actionButtonText}>👤 Show Customer ID</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={fetchCustomerInfo}>
          <Text style={styles.actionButtonText}>📊 Refresh Status</Text>
        </TouchableOpacity>
        
        {isPremium && (
          <TouchableOpacity style={[styles.actionButton, styles.manageSubButton]} onPress={openManageSubscriptions}>
            <Text style={styles.actionButtonText}>⚙️ Manage Subscription</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Available Offerings */}
      <Text style={styles.sectionTitle}>Available Products</Text>
      
      {offerings.length === 0 ? (
        <Text style={styles.noOfferings}>No products configured</Text>
      ) : (
        <FlatList
          data={offerings}
          scrollEnabled={false}
          keyExtractor={(item) => item.identifier}
          renderItem={({ item }) => {
            // Check if this is monthly or yearly based on product ID
            const isMonthly = item.product.identifier.includes('monthly');
            const isYearly = item.product.identifier.includes('yearly');
            
            return (
              <View style={styles.productCard}>
                <View style={styles.productHeader}>
                  {isYearly && (
                    <View style={styles.bestValueBadge}>
                      <Text style={styles.bestValueText}>BEST VALUE</Text>
                    </View>
                  )}
                  <Text style={styles.productTitle}>{item.product.title}</Text>
                </View>
                
                <Text style={styles.productDescription}>{item.product.description}</Text>
                <Text style={styles.productPrice}>{item.product.priceString}</Text>
                <Text style={styles.productPeriod}>
                  {isMonthly ? 'per month' : isYearly ? 'per year' : ''}
                </Text>
                
                <View style={styles.productDetails}>
                  <Text style={styles.detailText}>Product ID: {item.product.identifier}</Text>
                  <Text style={styles.detailText}>Package: {item.identifier}</Text>
                  <Text style={styles.detailText}>Type: {item.packageType || 'Custom'}</Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.purchaseButton,
                    isPremium && styles.alreadyPremiumButton
                  ]}
                  onPress={() => purchasePackage(item)}
                  disabled={isPremium}
                >
                  <Text style={styles.purchaseButtonText}>
                    {isPremium ? 'Already Premium ✓' : 'Subscribe Now'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  statusCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  entitlementItem: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  entitlementName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  entitlementDetail: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
  },
  actionButtons: {
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 8,
    marginBottom: 8,
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  noOfferings: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
  productCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  productHeader: {
    marginBottom: 8,
  },
  bestValueBadge: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  bestValueText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  productPeriod: {
    fontSize: 14,
    color: '#888',
    marginTop: -8,
    marginBottom: 12,
  },
  productDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 12,
  },
  productDetails: {
    marginBottom: 12,
  },
  detailText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  purchaseButton: {
    backgroundColor: '#34C759',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  purchaseButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  premiumCard: {
    backgroundColor: '#E8F5E9',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  featureList: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  featureItem: {
    fontSize: 14,
    color: '#555',
    marginVertical: 4,
  },
  subscriptionDetails: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#FFF',
    borderRadius: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 8,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  alreadyPremiumButton: {
    backgroundColor: '#9E9E9E',
  },
  // Image Gallery Styles
  galleryContainer: {
    marginBottom: 20,
  },
  gallerySubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    marginTop: -8,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  imageCard: {
    width: '48%',
    marginBottom: 12,
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lockedImageContainer: {
    height: 120,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  blurredImage: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#BDBDBD',
    width: '100%',
    height: '100%',
  },
  lockIcon: {
    fontSize: 32,
  },
  lockText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 6,
  },
  unlockText: {
    color: '#FFF',
    fontSize: 10,
    textAlign: 'center',
    fontWeight: '600',
  },
  unlockedImageContainer: {
    height: 120,
    position: 'relative',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  freeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  freeBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  premiumBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFD700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  premiumBadgeText: {
    fontSize: 12,
  },
  imageTitle: {
    padding: 8,
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
  upgradePrompt: {
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#FFB74D',
  },
  upgradeText: {
    color: '#E65100',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
  // Subscription Status Card Styles
  subscriptionStatusCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  statusMessage: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusDetails: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusDetailLabel: {
    fontSize: 13,
    color: '#888',
  },
  statusDetailValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
  },
  warningText: {
    color: '#FF5722',
    fontWeight: 'bold',
  },
  billingWarning: {
    backgroundColor: '#FFEBEE',
    borderRadius: 6,
    padding: 10,
    marginTop: 8,
  },
  billingWarningText: {
    color: '#C62828',
    fontSize: 12,
    textAlign: 'center',
  },
  statusActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  resubscribeButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
  },
  resubscribeButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  manageButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
  },
  manageButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  manageSubButton: {
    backgroundColor: '#9C27B0',
  },
});

export default AdvancedPaymentTest;