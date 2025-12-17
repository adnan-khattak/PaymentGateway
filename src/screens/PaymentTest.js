import React, { useEffect, useState } from 'react';
import { View, Text, Button, ActivityIndicator, FlatList } from 'react-native';
import Purchases from 'react-native-purchases';

const PaymentTest = () => {
  const [offerings, setOfferings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entitlementActive, setEntitlementActive] = useState(false);

  useEffect(() => {
    // Initialize RevenueCat
    Purchases.configure({ apiKey: 'test_zLWxqaPyXMVfwFzSHmLVcnEZPjz' });
    fetchOfferings();
    checkEntitlement();
  }, []);

  // Fetch available products
  const fetchOfferings = async () => {
    try {
      const fetchedOfferings = await Purchases.getOfferings();
      if (fetchedOfferings.current && fetchedOfferings.current.availablePackages.length > 0) {
        setOfferings(fetchedOfferings.current.availablePackages);
      } else {
        console.log('No offerings available.');
      }
    } catch (e) {
      console.log('Error fetching offerings:', e);
    } finally {
      setLoading(false);
    }
  };

  // Purchase a package
  const purchasePackage = async (selectedPackage) => {
    try {
      const { customerInfo } = await Purchases.purchasePackage(selectedPackage);
      console.log('Purchase successful:', customerInfo);
      if (customerInfo.entitlements.active['premium']) {
        setEntitlementActive(true);
      }
    } catch (e) {
      if (!e.userCancelled) {
        console.log('Purchase error:', e);
      } else {
        console.log('User cancelled the purchase.');
      }
    }
  };

  // Check entitlement status
  const checkEntitlement = async () => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      if (customerInfo.entitlements.active['premium']) {
        setEntitlementActive(true);
      }
    } catch (e) {
      console.log('Error checking entitlements:', e);
    }
  };

  if (loading) return <ActivityIndicator size="large" />;

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 20, marginBottom: 20 }}>
        {entitlementActive ? 'Premium Access Active ✅' : 'No Premium Access ❌'}
      </Text>

      <FlatList
        data={offerings}
        keyExtractor={(item) => item.identifier}
        renderItem={({ item }) => (
          <View style={{ marginBottom: 15 }}>
            <Text style={{ fontSize: 16 }}>{item.product.title}</Text>
            <Text>{item.product.description}</Text>
            <Text style={{ fontWeight: 'bold' }}>{item.product.price_string}</Text>
            <Button
              title="Purchase"
              onPress={() => purchasePackage(item)}
            />
          </View>
        )}
      />
    </View>
  );
};

export default PaymentTest;
