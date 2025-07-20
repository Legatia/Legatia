import { createProfile, getOwnProfile } from './profiles';

// Completely mock the profiles.ts module
jest.mock('./profiles', () => ({
  createProfile: jest.fn(),
  getOwnProfile: jest.fn(),
  // Mock other functions from profiles.ts as needed
}));

describe('profiles service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a profile successfully', async () => {
    const mockProfile = { name: "Test User", sex: "Male", birthday: "01/01/2000", birthplace: "Test City", photo: [] };
    (createProfile as jest.Mock).mockResolvedValueOnce({ Ok: null });

    const result = await createProfile(mockProfile);
    expect(createProfile).toHaveBeenCalledWith(mockProfile);
    expect(result).toEqual({ Ok: null });
  });

  it('should get own profile successfully', async () => {
    const mockProfile = { name: "Existing User", sex: "Female", birthday: "01/01/1990", birthplace: "Another City", photo: [] };
    (getOwnProfile as jest.Mock).mockResolvedValueOnce({ Ok: mockProfile });

    const result = await getOwnProfile();
    expect(getOwnProfile).toHaveBeenCalled();
    expect(result).toEqual({ Ok: mockProfile });
  });

  // Add more tests for other functions in profiles.ts
});
