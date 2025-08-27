import ChatWindow from '../../components/ChatWindow';

export default function Chat({ conversationId }) {
  return <ChatWindow conversationId={conversationId} />;
}

export async function getServerSideProps({ params }) {
  return {
    props: {
      conversationId: params.conversationId,
    },
  };
}