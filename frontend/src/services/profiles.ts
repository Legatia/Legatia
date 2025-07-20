import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { idlFactory as profiles_idl, canisterId as profiles_id } from '../../../src/declarations/profiles';
import type { _SERVICE as ProfilesService, Profile } from '../../../src/declarations/profiles/profiles.did';
export type { Profile };

const agent = new HttpAgent({ host: process.env.DFX_NETWORK === 'ic' ? 'https://ic0.app' : 'http://localhost:4943' });

// TODO: Remove this line when deploying to IC. For local development, we need to bypass the replica certificate validation.
if (process.env.DFX_NETWORK !== 'ic') {
  agent.fetchRootKey().catch(err => {
    console.warn("Unable to fetch root key. Check to ensure that your local replica is running");
    console.error(err);
  });
}

function getProfilesCanister(): ProfilesService {
  return Actor.createActor<ProfilesService>(profiles_idl, {
    agent,
    canisterId: Principal.fromText(profiles_id),
  });
}

export const createProfile = async (profile: Profile) => {
  return getProfilesCanister().create_profile(profile);
};

export const readProfile = async (principal: Principal) => {
  return getProfilesCanister().read_profile(principal);
};

export const getOwnProfile = async () => {
  return getProfilesCanister().get_own_profile();
};

export const updateProfile = async (profile: Profile) => {
  return getProfilesCanister().update_profile(profile);
};

export const generateLinkingCode = async () => {
  return getProfilesCanister().generate_linking_code();
};

export const linkDevice = async (code: string) => {
  return getProfilesCanister().link_device(code);
};

export const unlinkDevice = async (principal: Principal) => {
  return getProfilesCanister().unlink_device(principal);
};

export const isRegisteredUser = async (principal: Principal) => {
  return getProfilesCanister().is_registered_user(principal);
};

export const getLinkedPrincipals = async () => {
  return getProfilesCanister().get_linked_principals();
};
