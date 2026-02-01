/**
 * Complete Integration Example for Frontend Team
 * Copy and adapt these examples for your React Native/Web app
 */

import React, { useState, useEffect } from 'react';
import { View, Text, Button, TextInput, ActivityIndicator, Alert } from 'react-native';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// ============================================================================
// 1. INITIALIZE FIREBASE FUNCTIONS
// ============================================================================

const functions = getFunctions();
const auth = getAuth();
const db = getFirestore();
const storage = getStorage();

// For local development (optional)
// import { connectFunctionsEmulator } from 'firebase/functions';
// if (__DEV__) {
//   connectFunctionsEmulator(functions, 'localhost', 5001);
// }

// Initialize callable functions
const checkEligibility = httpsCallable(functions, 'checkEligibility');
const submitApplication = httpsCallable(functions, 'submitApplication');
const verifyApplication = httpsCallable(functions, 'verifyApplication');
const processClaim = httpsCallable(functions, 'processClaim');

// ============================================================================
// 2. TYPE DEFINITIONS
// ============================================================================

interface EligibilityResult {
  programId: string;
  programName: string;
  eligibility: {
    status: 'ELIGIBLE' | 'POTENTIAL_MATCH' | 'LOCKED';
    matchScore: number;
    missingRequirements: string[];
    gapDataChecklist?: string[];
  };
}

interface ApplicationResponse {
  applicationId: string;
  feeAmount: number;
  feeStatus: 'PAID' | 'WAIVED' | 'N/A';
}

// ============================================================================
// 3. EXAMPLE: HOME SCREEN - Show Eligible Programs
// ============================================================================

export const HomeScreen = () => {
  const [eligiblePrograms, setEligiblePrograms] = useState<EligibilityResult[]>([]);
  const [potentialMatches, setPotentialMatches] = useState<EligibilityResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Listen to auth state
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        loadEligiblePrograms();
      }
    });

    return unsubscribe;
  }, []);

  const loadEligiblePrograms = async () => {
    try {
      setLoading(true);
      const result = await checkEligibility({});
      
      const eligible = result.data.results.filter(
        (r: EligibilityResult) => r.eligibility.status === 'ELIGIBLE'
      );
      const potential = result.data.results.filter(
        (r: EligibilityResult) => r.eligibility.status === 'POTENTIAL_MATCH'
      );

      setEligiblePrograms(eligible);
      setPotentialMatches(potential);
    } catch (error: any) {
      if (error.code === 'unauthenticated') {
        Alert.alert('Error', 'Please log in to view programs');
      } else {
        Alert.alert('Error', 'Failed to load programs');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <Text>Please log in</Text>;
  }

  if (loading) {
    return <ActivityIndicator size="large" />;
  }

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
        Available Programs
      </Text>

      <Text style={{ fontSize: 18, fontWeight: '600', marginTop: 20 }}>
        Eligible Programs ({eligiblePrograms.length})
      </Text>
      {eligiblePrograms.map((program) => (
        <View key={program.programId} style={{ marginVertical: 10, padding: 15, backgroundColor: '#e8f5e9', borderRadius: 8 }}>
          <Text style={{ fontSize: 16, fontWeight: '600' }}>{program.programName}</Text>
          <Text>Match Score: {program.eligibility.matchScore}%</Text>
          <Button
            title="Apply Now"
            onPress={() => {
              // Navigate to application screen
              console.log('Navigate to application:', program.programId);
            }}
          />
        </View>
      ))}

      <Text style={{ fontSize: 18, fontWeight: '600', marginTop: 20 }}>
        Complete Your Profile ({potentialMatches.length})
      </Text>
      {potentialMatches.map((program) => (
        <View key={program.programId} style={{ marginVertical: 10, padding: 15, backgroundColor: '#fff3e0', borderRadius: 8 }}>
          <Text style={{ fontSize: 16, fontWeight: '600' }}>{program.programName}</Text>
          <Text>Missing: {program.eligibility.gapDataChecklist?.join(', ')}</Text>
          <Button
            title="Complete Profile"
            onPress={() => {
              // Navigate to profile completion
              console.log('Complete profile for:', program.eligibility.gapDataChecklist);
            }}
          />
        </View>
      ))}
    </View>
  );
};

// ============================================================================
// 4. EXAMPLE: APPLICATION SUBMISSION SCREEN
// ============================================================================

export const ApplicationScreen = ({ programId }: { programId: string }) => {
  const [documents, setDocuments] = useState<Record<string, string>>({});
  const [appointment, setAppointment] = useState<{ date: string; time: string; location: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const uploadDocument = async (fileUri: string, documentType: string) => {
    try {
      setUploading(true);
      // Convert file to blob (adjust based on your file handling)
      const response = await fetch(fileUri);
      const blob = await response.blob();

      // Upload to Firebase Storage
      const storageRef = ref(storage, `documents/${auth.currentUser?.uid}/${documentType}_${Date.now()}`);
      await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(storageRef);

      setDocuments((prev) => ({ ...prev, [documentType]: url }));
      Alert.alert('Success', 'Document uploaded');
    } catch (error) {
      Alert.alert('Error', 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const result = await submitApplication({
        programId,
        uploadedDocuments: documents,
        appointmentSlot: appointment || undefined,
      });

      const response = result.data as ApplicationResponse;

      if (response.feeStatus === 'PAID' && response.feeAmount > 0) {
        Alert.alert(
          'Payment Required',
          `Please pay PHP ${response.feeAmount}`,
          [
            {
              text: 'Pay Now',
              onPress: () => {
                // Navigate to payment screen
                console.log('Navigate to payment:', response.applicationId, response.feeAmount);
              },
            },
          ]
        );
      } else {
        Alert.alert('Success', 'Application submitted successfully!');
        // Navigate back or refresh
      }
    } catch (error: any) {
      if (error.code === 'already-exists') {
        Alert.alert('Error', 'You already have a pending application for this program');
      } else if (error.code === 'invalid-argument') {
        Alert.alert('Error', `Invalid input: ${error.message}`);
      } else {
        Alert.alert('Error', 'Failed to submit application');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
        Submit Application
      </Text>

      <Text style={{ marginTop: 10 }}>Upload Documents:</Text>
      <Button
        title="Upload Birth Certificate"
        onPress={() => {
          // Open file picker
          console.log('Open file picker for birth certificate');
        }}
      />
      <Button
        title="Upload Barangay Clearance"
        onPress={() => {
          // Open file picker
          console.log('Open file picker for barangay clearance');
        }}
      />

      <Text style={{ marginTop: 20 }}>Appointment (Optional):</Text>
      <TextInput
        placeholder="Date (YYYY-MM-DD)"
        value={appointment?.date || ''}
        onChangeText={(text) =>
          setAppointment((prev) => ({ ...prev, date: text } as any))
        }
      />
      <TextInput
        placeholder="Time (HH:mm)"
        value={appointment?.time || ''}
        onChangeText={(text) =>
          setAppointment((prev) => ({ ...prev, time: text } as any))
        }
      />
      <TextInput
        placeholder="Location"
        value={appointment?.location || ''}
        onChangeText={(text) =>
          setAppointment((prev) => ({ ...prev, location: text } as any))
        }
      />

      <Button
        title={submitting ? 'Submitting...' : 'Submit Application'}
        onPress={handleSubmit}
        disabled={submitting || uploading}
      />
    </View>
  );
};

// ============================================================================
// 5. EXAMPLE: ADMIN DASHBOARD - Verify Applications
// ============================================================================

export const AdminDashboard = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    checkUserRole();
    loadApplications();
  }, []);

  const checkUserRole = async () => {
    const user = auth.currentUser;
    if (user) {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      setUserRole(userDoc.data()?.role);
    }
  };

  const loadApplications = async () => {
    // Load applications from Firestore
    // This is just a placeholder - implement your Firestore query
    console.log('Load applications');
  };

  const handleApprove = async (applicationId: string) => {
    try {
      const result = await verifyApplication({
        applicationId,
        action: 'APPROVE',
      });
      Alert.alert('Success', result.data.message);
      loadApplications(); // Refresh
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        Alert.alert('Error', 'Admin access required');
      } else {
        Alert.alert('Error', 'Failed to approve application');
      }
    }
  };

  const handleReject = async (applicationId: string, reason: string) => {
    if (!reason.trim()) {
      Alert.alert('Error', 'Rejection reason is required');
      return;
    }

    try {
      const result = await verifyApplication({
        applicationId,
        action: 'REJECT',
        rejectionReason: reason,
      });
      Alert.alert('Success', 'Application rejected');
      loadApplications(); // Refresh
    } catch (error: any) {
      Alert.alert('Error', 'Failed to reject application');
    }
  };

  if (userRole !== 'admin') {
    return <Text>Admin access required</Text>;
  }

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
        Admin Dashboard
      </Text>
      {applications.map((app) => (
        <View key={app.id} style={{ marginVertical: 10, padding: 15, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
          <Text>Application ID: {app.id}</Text>
          <Text>Status: {app.status}</Text>
          <View style={{ flexDirection: 'row', marginTop: 10 }}>
            <Button title="Approve" onPress={() => handleApprove(app.id)} />
            <Button
              title="Reject"
              onPress={() => {
                // Show input dialog for rejection reason
                Alert.prompt(
                  'Rejection Reason',
                  'Enter reason for rejection:',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Reject',
                      onPress: (reason) => reason && handleReject(app.id, reason),
                    },
                  ],
                  'plain-text'
                );
              }}
            />
          </View>
        </View>
      ))}
    </View>
  );
};

// ============================================================================
// 6. EXAMPLE: QR CODE SCANNING (Distribution)
// ============================================================================

// Note: This requires expo-barcode-scanner or similar library
// import { BarCodeScanner } from 'expo-barcode-scanner';

export const DistributionScreen = () => {
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleQRScan = async (data: string) => {
    if (scanned || processing) return;

    setScanned(true);
    setProcessing(true);

    try {
      const result = await processClaim({
        qrCodeString: data,
        location: 'City Hall - Main Office', // Optional
      });

      Alert.alert('Success', result.data.message);
      // Update UI or refresh data
    } catch (error: any) {
      if (error.code === 'failed-precondition') {
        if (error.message.includes('status')) {
          Alert.alert('Error', 'Application must be APPROVED to process claim');
        } else if (error.message.includes('appointment')) {
          Alert.alert('Error', 'Cannot process claim before appointment date/time');
        } else {
          Alert.alert('Error', error.message);
        }
      } else {
        Alert.alert('Error', 'Failed to process claim');
      }
    } finally {
      setProcessing(false);
      // Reset after 2 seconds
      setTimeout(() => setScanned(false), 2000);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Text style={{ padding: 20, fontSize: 18, fontWeight: 'bold' }}>
        Scan QR Code to Process Claim
      </Text>
      {/* 
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : ({ data }) => handleQRScan(data)}
        style={{ flex: 1 }}
        barCodeTypes={[BarCodeScanner.Constants.BarCodeType.qr]}
      />
      */}
      {scanned && (
        <View style={{ padding: 20, backgroundColor: 'white' }}>
          <Text>Processing...</Text>
          <Button title="Tap to Scan Again" onPress={() => setScanned(false)} />
        </View>
      )}
    </View>
  );
};

// ============================================================================
// 7. UTILITY: Error Handler
// ============================================================================

export const handleFunctionError = (error: any) => {
  switch (error.code) {
    case 'unauthenticated':
      Alert.alert('Authentication Required', 'Please log in to continue');
      // Navigate to login
      break;
    case 'permission-denied':
      Alert.alert('Access Denied', 'You do not have permission to perform this action');
      break;
    case 'not-found':
      Alert.alert('Not Found', 'The requested resource was not found');
      break;
    case 'invalid-argument':
      Alert.alert('Invalid Input', error.message || 'Please check your input');
      break;
    case 'failed-precondition':
      Alert.alert('Error', error.message);
      break;
    case 'already-exists':
      Alert.alert('Already Exists', 'This resource already exists');
      break;
    case 'internal':
      Alert.alert('Server Error', 'An error occurred. Please try again.');
      break;
    default:
      Alert.alert('Error', 'An unexpected error occurred');
  }
};

// ============================================================================
// 8. CUSTOM HOOK: useEligibility
// ============================================================================

export const useEligibility = (programId?: string) => {
  const [loading, setLoading] = useState(true);
  const [eligible, setEligible] = useState<EligibilityResult[]>([]);
  const [potential, setPotential] = useState<EligibilityResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEligibility();
  }, [programId]);

  const loadEligibility = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await checkEligibility({ programId });
      const results = result.data.results as EligibilityResult[];

      setEligible(results.filter((r) => r.eligibility.status === 'ELIGIBLE'));
      setPotential(
        results.filter((r) => r.eligibility.status === 'POTENTIAL_MATCH')
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { loading, eligible, potential, error, refetch: loadEligibility };
};

// Usage:
// const { loading, eligible, potential } = useEligibility();
// const { loading, eligible } = useEligibility('program123');
