import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Hr,
  Section,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface WelcomeEmailProps {
  email: string
}

export const WelcomeEmail = ({ email }: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to MarkManager!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Heading style={logo}>
            <span style={logoGradient}>Mark</span>
            <span style={logoLight}>Manager</span>
          </Heading>
        </Section>

        <Heading style={h1}>Welcome aboard! 🎉</Heading>

        <Text style={text}>
          Your account has been created with <strong>{email}</strong>.
        </Text>

        <Text style={text}>
          You now have access to the unified bookmark manager that makes saving,
          organizing, and rediscovering content effortless.
        </Text>

        <Text style={text}>Here's what you can do:</Text>

        <Text style={featureText}>
          ⚡ <strong>Multi-platform</strong> — Save from X, YouTube, Reddit, Medium & more
        </Text>
        <Text style={featureText}>
          ✨ <strong>AI-powered</strong> — Auto-tag, summarize, and ask questions
        </Text>
        <Text style={featureText}>
          📂 <strong>Smart organization</strong> — Folders, priority pins, and search
        </Text>

        <Hr style={hr} />

        <Text style={footer}>
          © MarkManager · Built by Abhay Parekh
        </Text>
      </Container>
    </Body>
  </Html>
)

export default WelcomeEmail

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
}

const container = {
  margin: '0 auto',
  padding: '20px 24px',
  maxWidth: '520px',
}

const headerSection = {
  paddingBottom: '8px',
}

const logo = {
  fontSize: '28px',
  fontWeight: '700' as const,
  margin: '0',
  padding: '0',
}

const logoGradient = {
  color: '#0ea5e9',
}

const logoLight = {
  fontWeight: '300' as const,
  fontStyle: 'italic' as const,
  color: '#334155',
}

const h1 = {
  color: '#1e293b',
  fontSize: '22px',
  fontWeight: '600' as const,
  margin: '24px 0 16px',
}

const text = {
  color: '#475569',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '8px 0',
}

const featureText = {
  color: '#475569',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '4px 0',
  paddingLeft: '8px',
}

const hr = {
  borderColor: '#e2e8f0',
  margin: '24px 0 16px',
}

const footer = {
  color: '#94a3b8',
  fontSize: '12px',
  lineHeight: '20px',
}
