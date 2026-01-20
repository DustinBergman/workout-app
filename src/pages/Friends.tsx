import { FC, useState } from 'react';
import { useFriends } from '../hooks/useFriends';
import { FriendSearchInput } from '../components/social/FriendSearchInput';
import { FriendRequestCard } from '../components/social/FriendRequestCard';
import { FriendListItem } from '../components/social/FriendListItem';
import { ProfileModal } from '../components/social/ProfileModal';
import { Card, Avatar } from '../components/ui';

export const Friends: FC = () => {
  const {
    friends,
    pendingRequests,
    sentRequests,
    isLoading,
    error,
    searchResults,
    isSearching,
    searchQuery,
    setSearchQuery,
    sendRequest,
    acceptRequest,
    declineRequest,
    cancelRequest,
    unfriend,
    refresh,
  } = useFriends();

  const [sendingRequestTo, setSendingRequestTo] = useState<string | null>(null);
  const [acceptingRequest, setAcceptingRequest] = useState<string | null>(null);
  const [decliningRequest, setDecliningRequest] = useState<string | null>(null);
  const [removingFriend, setRemovingFriend] = useState<string | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  const handleSendRequest = async (userId: string) => {
    setSendingRequestTo(userId);
    await sendRequest(userId);
    setSendingRequestTo(null);
  };

  const handleAcceptRequest = async (requestId: string) => {
    setAcceptingRequest(requestId);
    await acceptRequest(requestId);
    setAcceptingRequest(null);
  };

  const handleDeclineRequest = async (requestId: string) => {
    setDecliningRequest(requestId);
    await declineRequest(requestId);
    setDecliningRequest(null);
  };

  const handleRemoveFriend = async (friendId: string) => {
    setRemovingFriend(friendId);
    await unfriend(friendId);
    setRemovingFriend(null);
  };

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading friends...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">Friends</h1>

      {error && (
        <Card className="p-4 bg-destructive/10 border-destructive/50">
          <p className="text-destructive text-sm">{error}</p>
        </Card>
      )}

      {/* Search for friends */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Add Friends</h2>
        <FriendSearchInput
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchResults={searchResults}
          isSearching={isSearching}
          onSendRequest={handleSendRequest}
          sendingRequestTo={sendingRequestTo}
        />
      </section>

      {/* Pending requests received */}
      {pendingRequests.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">
            Friend Requests
            <span className="ml-2 px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
              {pendingRequests.length}
            </span>
          </h2>
          <div className="space-y-2">
            {pendingRequests.map((request) => (
              <FriendRequestCard
                key={request.id}
                request={request}
                onAccept={handleAcceptRequest}
                onDecline={handleDeclineRequest}
                onProfileClick={setSelectedProfileId}
                isAccepting={acceptingRequest === request.id}
                isDeclining={decliningRequest === request.id}
              />
            ))}
          </div>
        </section>
      )}

      {/* Sent requests (pending) */}
      {sentRequests.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-muted-foreground">Pending Sent Requests</h2>
          <div className="space-y-2">
            {sentRequests.map((request) => {
              const user = request.to_user;
              if (!user) return null;
              const displayName = user.first_name && user.last_name
                ? `${user.first_name} ${user.last_name}`
                : user.username || 'Anonymous';

              return (
                <Card key={request.id} className="flex items-center gap-3 p-4">
                  <button
                    onClick={() => setSelectedProfileId(user.id)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
                  >
                    <Avatar
                      src={user.avatar_url}
                      name={displayName}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{displayName}</p>
                      {user.username && (
                        <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                      )}
                    </div>
                  </button>
                  <button
                    onClick={() => cancelRequest(request.id)}
                    className="px-3 py-1.5 text-sm text-muted-foreground hover:text-destructive transition-colors"
                  >
                    Cancel
                  </button>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Friends list */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Your Friends
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({friends.length})
            </span>
          </h2>
          <button
            onClick={refresh}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Refresh"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {friends.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="font-semibold mb-1">No friends yet</h3>
            <p className="text-sm text-muted-foreground">
              Search for friends by username to add them
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {friends.map((friend) => (
              <FriendListItem
                key={friend.id}
                friend={friend}
                onRemove={handleRemoveFriend}
                onProfileClick={setSelectedProfileId}
                isRemoving={removingFriend === friend.id}
              />
            ))}
          </div>
        )}
      </section>

      {/* Profile Modal */}
      {selectedProfileId && (
        <ProfileModal
          isOpen={!!selectedProfileId}
          onClose={() => setSelectedProfileId(null)}
          userId={selectedProfileId}
        />
      )}
    </div>
  );
};
