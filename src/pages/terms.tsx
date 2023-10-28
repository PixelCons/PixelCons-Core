import {GetStaticProps} from 'next';
import React from 'react';
import Layout from '../components/layout';
import clsx from 'clsx';
import textStyles from '../styles/text.module.scss';
import utilStyles from '../styles/utils.module.scss';

//Static props for page pre building
export const getStaticProps: GetStaticProps = async () => {
  return {
    props: {},
  };
};

//The terms of use page for using pixelcons
export default function Terms() {
  //render
  return (
    <Layout>
      <div className={clsx(utilStyles.basicContainer, textStyles.lg)}>
        <div className={clsx(textStyles.xxl, textStyles.bold, utilStyles.basicSection)}>
          <div>Terms of Use</div>
          <div className={textStyles.xl}>Last Updated: January 1, 2019</div>
        </div>
        <div className={clsx(textStyles.lowEmphasis, utilStyles.basicSection)}>
          PixelCons is a platform for unique tokenized minimalistic pixel art that can be created, transferred, and
          owned by users through the Ethereum network using a specially developed smart contract (the “Smart Contract”).
          A user interface is provided in the form of a website (the “Site”). Using the combined Site and Smart Contract
          (the “Service”), users can view their PixelCons as well as create, trade, and sell them. Please read these
          Terms of Use (“Terms”, “Terms of Use”) carefully before using the Service operated by PixelCons (“us”, “we”,
          or “our”).
        </div>
        <div className={clsx(textStyles.lowEmphasis, utilStyles.basicSection)}>
          Your access to and use of the Service is conditioned on your acceptance of and compliance with these Terms.
          These Terms apply to all visitors, users and others who access or use the Service.
        </div>
        <div className={clsx(textStyles.lowEmphasis, utilStyles.basicSection)}>
          By accessing or using the Service you agree to be bound by these Terms. If you disagree with any part of the
          terms then you may not access the Service. This Terms of Service agreement for PixelCons was generated in part
          by the{' '}
          <a className={utilStyles.subtleLink} href="https://termsfeed.com/terms-conditions/generator/">
            Terms and Conditions Generator
          </a>
          .
        </div>
        <div className={clsx(textStyles.xl, textStyles.bold, utilStyles.basicSection)}>The PixelCons Platform</div>
        <div className={clsx(textStyles.lowEmphasis, utilStyles.basicSection)}>
          In order to to use the Service, you must first have a web browser with a web3 provider installed on your
          device. This includes several mobile Ethereum wallet apps or a desktop browser like FireFox or Google Chrome,
          with an extension called MetaMask installed. The apps or browser extensions provide an electronic wallet which
          is required for you to interact with the Smart Contract. The Service will not recognize you as a user until
          you are accessing it with a web3 provider. This is the only way to use the Service beyond a read only
          interface.
        </div>
        <div className={clsx(textStyles.lowEmphasis, utilStyles.basicSection)}>
          You are responsible for the security of your electronic wallet. Our Service may contain links to third-party
          web sites or services that are not owned or controlled by Us including the mentioned web3 providers. We have
          no control over, and assumes no responsibility for, the content, privacy policies, or practices of any third
          party websites or services. You further acknowledge and agree that We shall not be responsible or liable,
          directly or indirectly, for any damage or loss caused or alleged to be caused by or in connection with use of
          or reliance on any such content, goods or services available on or through any such websites or services. This
          includes third parties that may also interact with the Smart Contract.
        </div>
        <div className={clsx(textStyles.lowEmphasis, utilStyles.basicSection)}>
          All transactions with the Service are managed by the Ethereum blockchain, which require as small free to
          process them (a “Gas Fee”). You are expected to pay this fee to help fund the network of decentralized
          computers that make up Ethereum.You also understand that transactions on the Ethereum blockchain are public,
          meaning your Ethereum public address will be seen publicly interacting with the Smart Contract.
        </div>
        <div className={clsx(textStyles.lowEmphasis, utilStyles.basicSection)}>
          You will be solely responsible to pay any and all sales, use, value-added and other taxes, duties, and
          assessments (except taxes on our net income) now or hereafter claimed or imposed by any governmental authority
          (collectively, “Taxes”) associated with your use of the Service (including, without limitation, any Taxes that
          may become payable as the result of your ownership, transfer, or creation of any of your PixelCons).
        </div>
        <div className={clsx(textStyles.lowEmphasis, utilStyles.basicSection)}>
          You agree and understand that the Service is only a platform. This means you are responsible for your own
          conduct and consequences while using the Service. This includes but is not limited to, creating, trading or
          naming a PixelCon or content that is considered unlawful, defamatory, harassing, abusive, fraudulent, obscene,
          or otherwise objectionable. You also agree not to do anything malicious in nature, including but not limited
          to, distributing viruses, misinformation, or anything deceptive in nature. This especially includes creating
          content in the Service that infringes on the intellectual proprietary rights of any party.
        </div>
        <div className={clsx(textStyles.lowEmphasis, utilStyles.basicSection)}>
          As a platform, the Service also does not guarantee any safety during use. This includes, but is not limited
          to, preventing exposure to content that may be deemed inappropriate. The Service provides no sort of filter
          for hiding content that may be seen as offensive. The Service can be thought of as a web browser for the
          content created on the Smart Contract by its users.
        </div>
        <div className={clsx(textStyles.xl, textStyles.bold, utilStyles.basicSection)}>The PixelCons Core Contract</div>
        <div className={clsx(textStyles.lowEmphasis, utilStyles.basicSection)}>
          The Service utilizes a single Smart Contract (the “Core Contract”) for maintaining the platform core state,
          including ownership and creation of PixelCons. You understand and have reviewed the functions defined in the
          Core Contract (
          <a
            className={utilStyles.subtleLink}
            href="https://etherscan.io/address/0x5536b6aadd29eaf0db112bb28046a5fad3761bd4#code"
          >
            source code
          </a>
          ). We do not possess any special control or abilities for interacting with this Smart Contract beyond the
          public user functions with the exception of the three admin functions described below.
          <ol type="1">
            <li>
              We retain the ability to withdraw any ether transferred to the Core Contract. There are no required value
              amounts to execute any of the Core Contract functions, so any ether sent to the Core Contract is strictly
              volunteered. We are not responsible for returning any ether sent to the Core Contract intentionally or
              otherwise.
            </li>
            <li>
              We retain the ability to set the metadata URI link in the Core Contract. This allows Us to provide a
              reliable reference for third party websites to read PixelCon metadata. All meta data for a PixelCon can be
              obtained through secondary functions in the Core Contract.
            </li>
            <li>We retain the ability to transfer admin control to another Ethereum address.</li>
          </ol>
          You can freely create, modify and transfer ownership of PixelCons at your own discretion. To create a
          PixelCon, it must simply be unique, meaning it is not currently owned by another user. You can also group
          PixelCons you create and currently own into collections (a “Collection”). When creating a PixelCon or
          collection you will have the option of giving it a name for other users to see and help them search for it. If
          you elect to interact with the Core Contract, you understand that all transactions are facilitated through the
          Ethereum network, which We do not have any special insight or control over. This means We are not liable to
          you or to any third party for claims or damages that result from these interactions.
        </div>
        <div className={clsx(textStyles.lowEmphasis, utilStyles.basicSection)}>
          Additionally, the Core Contract implements the ERC-721 specification for non-fungible tokens. This means that
          PixelCons may be recognized by third party applications to provide further functionality. This includes but is
          not limited to buying and selling PixelCons or using them in a context beyond ownership of the raw token asset
          defined in the Core Contract. We are not liable for damages that may be incurred through use of these third
          party services, including any services that are linked to from the Site. You must read and agree to any third
          party applications terms of service before interacting with their services.
        </div>
        <div className={clsx(textStyles.xl, textStyles.bold, utilStyles.basicSection)}>Disclaimers</div>
        <div className={clsx(textStyles.lowEmphasis, utilStyles.basicSection)}>
          You expressly understand and agree that your use and access to the Service is at your sole risk. The Service
          is provided “as is” with no warranties of any kind. We will not be liable for any losses you incur as the
          result of using the Service or Ethereum network in general.
        </div>
        <div className={clsx(textStyles.lowEmphasis, utilStyles.basicSection)}>
          You accept and understand the risks inherent with blockains. This includes, but is not limited to, volatile
          changes in the price of digital assets, the requirement of Gas Fees to be paid for every transaction, reliance
          on an internet connection, an uncertain regulatory environment, and possible damages or losses from a hard
          fork.
        </div>
        <div className={clsx(textStyles.lowEmphasis, utilStyles.basicSection)}>
          Additionally, you accept and understand the risk of interacting with the Service Smart Contract. This
          includes, but is not limited to, future identification of potentially breaking bugs that could result in loss
          of ownership of Pixelcons or freezing of future transactions. We are not liable for any damages that result
          from a fault in the code and are not expected to remedy the situation if it should arise. All code for the
          Service is open source for you to review{' '}
          <a className={utilStyles.subtleLink} href="https://github.com/PixelCons/PixelCons-Contracts">
            here
          </a>
          .
        </div>
        <div className={clsx(textStyles.lowEmphasis, utilStyles.basicSection)}>
          Finally, We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a
          revision is material we will try to provide at least 30 days notice prior to any new terms taking effect. What
          constitutes a material change will be determined at our sole discretion.
        </div>
        <div className={clsx(textStyles.lowEmphasis, utilStyles.basicSection)}>
          By continuing to access or use our Service after those revisions become effective, you agree to be bound by
          the revised terms. If you do not agree to the new terms, please stop using the Service.
        </div>
      </div>
    </Layout>
  );
}
