import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });
import { withDB } from '../src/lib/server/db';
import User from '../src/models/User';

async function fixUserRoles() {
  return withDB(async () => {
    const user = await User.findOne({ clerkId: 'user_2xzK3S2flSFjSKjEnfWbzquIFI3' });
    if (user) {
      console.log('Current user data:');
      console.log('- roles:', user.roles);
      console.log('- role:', user.role);
      
      // Ensure the user has the proper roles array
      if (!user.roles || user.roles.length === 0) {
        user.roles = ['staff'];
        await user.save();
        console.log('Updated user with roles array: ["staff"]');
      } else {
        console.log('User already has roles array:', user.roles);
      }
      
      // Refresh and verify
      const updatedUser = await User.findOne({ clerkId: 'user_2xzK3S2flSFjSKjEnfWbzquIFI3' });
      console.log('Final user roles:', updatedUser?.roles);
    } else {
      console.log('User not found');
    }
  });
}

fixUserRoles().then(() => {
  console.log('Done');
  process.exit(0);
}).catch(error => {
  console.error('Error:', error);
  process.exit(1);
});