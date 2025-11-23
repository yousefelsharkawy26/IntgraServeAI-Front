import ButtonMoveBack from '../components/ButtonMoveBack';
import { Helmet } from 'react-helmet-async';
import metaTage from '../metaTags.json';

const UnderDevelopmentPage = () => {
  return (
    <div className="font-cairo m-auto block w-full text-7xl">
      <Helmet>
        <title>{metaTage.UnderDevelopmentPage.title}</title>
        <meta
          name="description"
          content={metaTage.UnderDevelopmentPage.description}
        />
        <meta
          name="keywords"
          content={metaTage.UnderDevelopmentPage.keywords}
        />
      </Helmet>
      <ButtonMoveBack />
      <h1>مازالت تحت التطوير</h1>
    </div>
  );
};

export default UnderDevelopmentPage;
