import ButtonMoveBack from '../components/ButtonMoveBack';
import metaTage from '../metaTags.json';

const UnderDevelopmentPage = () => {
  return (
    <div className="font-cairo m-auto block w-full text-7xl">
      <title>{metaTage.UnderDevelopmentPage.title}</title>
      <meta
        name="description"
        content={metaTage.UnderDevelopmentPage.description}
      />
      <meta name="keywords" content={metaTage.UnderDevelopmentPage.keywords} />
      <ButtonMoveBack className="relative! top-0! left-5!" />
      <h1>Still under development</h1>
    </div>
  );
};

export default UnderDevelopmentPage;
