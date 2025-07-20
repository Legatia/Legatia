import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { getOwnProfile, createProfile, generateLinkingCode, linkDevice, unlinkDevice, getLinkedPrincipals, Profile } from '../services/profiles';

import { Html5QrcodeScanner } from "html5-qrcode";
import { Principal } from '@dfinity/principal';

const Dashboard: React.FC = () => {
  const { principal, logout } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linkingCode, setLinkingCode] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [linkedPrincipals, setLinkedPrincipals] = useState<Principal[]>([]);

  const fetchProfileAndLinkedPrincipals = async () => {
    if (principal) {
      try {
        const profileResult = await getOwnProfile();
        if ('Ok' in profileResult) {
          setProfile(profileResult.Ok);
        } else {
          setProfile(null);
        }

        const linkedPrincipalsResult = await getLinkedPrincipals();
        if ('Ok' in linkedPrincipalsResult) {
          setLinkedPrincipals(linkedPrincipalsResult.Ok);
        } else {
          setError(`Failed to fetch linked principals: ${linkedPrincipalsResult.Err}`);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to fetch data.");
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchProfileAndLinkedPrincipals();
  }, [principal]);

  const handleCreateProfile = async () => {
    if (principal) {
      setLoading(true);
      setError(null);
      const newProfile: Profile = {
        name: "New User", // Placeholder
        sex: "Unknown", // Placeholder
        birthday: "", // Placeholder
        birthplace: "", // Placeholder
        photo: [], // Placeholder
      };
      try {
        const result = await createProfile(newProfile);
        if ('Ok' in result) {
          setProfile(newProfile);
        } else {
          setError(`Failed to create profile: ${result.Err}`);
        }
      } catch (err) {
        console.error("Error creating profile:", err);
        setError("Failed to create profile.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleGenerateLinkingCode = async () => {
    setError(null);
    try {
      const result = await generateLinkingCode();
      if ('Ok' in result) {
        setLinkingCode(result.Ok);
      } else {
        setError(`Failed to generate linking code: ${result.Err}`);
      }
    } catch (err) {
      console.error("Error generating linking code:", err);
      setError("Failed to generate linking code.");
    }
  };

  const onScanSuccess = async (decodedText: string) => {
    setShowScanner(false);
    setError(null);
    try {
      const result = await linkDevice(decodedText);
      if ('Ok' in result) {
        alert("Device linked successfully!");
        fetchProfileAndLinkedPrincipals(); // Refresh linked principals
      } else {
        setError(`Failed to link device: ${result.Err}`);
      }
    } catch (err) {
      console.error("Error linking device:", err);
      setError("Failed to link device.");
    }
  };

  const onScanError = (errorMessage: string) => {
    console.warn(errorMessage);
  };

  useEffect(() => {
    if (showScanner) {
      const html5QrCodeScanner = new Html5QrcodeScanner(
        "qr-code-full-region",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );
      html5QrCodeScanner.render(onScanSuccess, onScanError);

      return () => {
        html5QrCodeScanner.clear().catch(error => {
          console.error("Failed to clear html5QrcodeScanner", error);
        });
      };
    }
  }, [showScanner]);

  const handleUnlinkDevice = async (principalToUnlink: Principal) => {
    setError(null);
    try {
      const result = await unlinkDevice(principalToUnlink);
      if ('Ok' in result) {
        alert("Device unlinked successfully!");
        fetchProfileAndLinkedPrincipals(); // Refresh linked principals
      } else {
        setError(`Failed to unlink device: ${result.Err}`);
      }
    } catch (err) {
      console.error("Error unlinking device:", err);
      setError("Failed to unlink device.");
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div>;
  }

  if (error) {
    return <div style={{ textAlign: 'center', marginTop: '50px', color: 'red' }}>Error: {error}</div>;
  }

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Dashboard</h1>
      <p>Welcome, {principal?.toText()}</p>

      {profile ? (
        <div>
          <h2>Your Profile</h2>
          <p>Name: {profile.name}</p>
          <p>Sex: {profile.sex}</p>
          <p>Birthday: {profile.birthday}</p>
          <p>Birthplace: {profile.birthplace}</p>
          {/* Add more profile details here */}
        </div>
      ) : (
        <div>
          <p>No profile found. Please create one.</p>
          <button onClick={handleCreateProfile} style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}>
            Create Profile
          </button>
        </div>
      )}

      <hr style={{ margin: '40px auto', width: '80%' }} />

      <h2>Device Management</h2>
      <button onClick={handleGenerateLinkingCode} style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer', marginRight: '10px' }}>
        Generate Linking QR Code
      </button>
      <button onClick={() => setShowScanner(!showScanner)} style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}>
        {showScanner ? 'Hide Scanner' : 'Scan QR Code to Link Device'}
      </button>

      {linkingCode && (
        <div style={{ marginTop: '20px' }}>
          <h3>Scan this QR Code on another device:</h3>
          
          <p>Code: {linkingCode}</p>
        </div>
      )}

      {showScanner && (
        <div id="qr-code-full-region" style={{ width: '500px', margin: '20px auto' }}></div>
      )}

      <div style={{ marginTop: '20px' }}>
        <h3>Linked Devices:</h3>
        <ul>
          {linkedPrincipals.map((p) => (
            <li key={p.toText()}>
              {p.toText()} {p.toText() === principal?.toText() && "(Current Device)"}
              {linkedPrincipals.length > 1 && p.toText() !== principal?.toText() && (
                <button onClick={() => handleUnlinkDevice(p)} style={{ marginLeft: '10px', padding: '5px 10px' }}>
                  Unlink
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      <button onClick={logout} style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer', marginTop: '40px' }}>
        Logout
      </button>
    </div>
  );
};

export default Dashboard;