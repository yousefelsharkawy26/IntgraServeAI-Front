import ButtonMoveBack from '@/components/ButtonMoveBack';
import metaTags from '../metaTags.json';
import { useLocation } from 'react-router';

const PageNotFound = () => {
  const location = useLocation();
  return (
    <div className={'font-cairo flex w-full flex-col'} dir={'rtl'}>
      <title>{metaTags.PageNotFound.title}</title>
      <meta name="description" content={metaTags.PageNotFound.description} />
      <meta name="keywords" content={metaTags.PageNotFound.keywords} />
      <ButtonMoveBack />
      <div className={'my-4 flex flex-col items-center justify-center gap-3'}>
        <p className={'text-3xl'}>OMG 😥</p>
        <p
          className={
            "before:text-secondary relative px-2 before:absolute before:-top-2 before:left-full before:text-center before:text-3xl before:content-['-']"
          }
        >
          <span className="font-bold text-red-600">{location.pathname}</span>
          <span className="">That route doesn't actually exist.</span>
        </p>
      </div>
    </div>
  );
};

export default PageNotFound;
