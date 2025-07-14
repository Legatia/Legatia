export const idlFactory = ({ IDL }) => {
  const Profile = IDL.Record({
    'name' : IDL.Text,
    'surname' : IDL.Text,
    'user_id' : IDL.Text,
    'email' : IDL.Text,
    'family_id' : IDL.Opt(IDL.Text),
  });
  return IDL.Service({
    'create_profile' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text, IDL.Opt(IDL.Text), IDL.Opt(IDL.Text)],
        [IDL.Variant({ 'Ok' : Profile, 'Err' : IDL.Text })],
        [],
      ),
    'get_profile' : IDL.Func([IDL.Text], [IDL.Opt(Profile)], []),
  });
};
export const init = ({ IDL }) => { return []; };
