import { useState, useCallback, useEffect, useRef } from 'react';
import {
  BlockitClient,
  BlockType,
  BlockSnapshot,
  DocumentRef,
  InteractionChangesetType
} from '@lark-opdev/block-docs-addon-api';
import './index.css';
import IconRefresh from './icon/IconRefresh';
import IconEdit from './icon/IconEdit';

const DocMiniApp = new BlockitClient().initAPI();

export default () => {
  const [height, setHeight] = useState<number>(30);
  const [state, setState] = useState<any>({});
  const [show, setShow] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const saveState = useCallback(() => {
    setLoading(true);
    DocMiniApp.Interaction.setData({
      type: InteractionChangesetType.REPLACE,
      data: {
        path: ['url'],
        value: state.url
      }
    })
      .then((data) => {
        console.log('setData', data);
        setShow(true);
      })
      .catch((err) => {
        console.log('setData err', err);
      });
  }, [state.url]);
  useEffect(() => {
    DocMiniApp.Interaction.getData().then((data) => {
      console.log('getData', data);
      if (data.url) {
        setState(data);
        setShow(true);
      }
    });
    const fn = (e: any) => {
      if (e.data?.type === 'onReady') {
        console.log('iframe message', e);
        let height = e.data?.data?.height || 300;
        setHeight(height);
        setLoading(false);
      }
    };
    window.addEventListener('message', fn);
    return () => {
      window.removeEventListener('message', fn);
    };
  }, []);
  useEffect(() => {
    DocMiniApp.Bridge.updateHeight(height);
  }, [height]);
  return (
    <div className="wordcount-demo" style={{ height: height + 'px' }}>
      {loading && (
        <div
          style={{
            height: '100%',
            width: '100%',
            position: 'fixed',
            background: '#fff',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <div className="loading"></div>
        </div>
      )}
      {show ? (
        <>
          <div style={{ position: 'fixed', right: 10, top: 0, display: 'flex' }}>
            <div
              style={{ cursor: 'pointer' }}
              onClick={() => {
                setShow(false);
                setHeight(30);
                const url = state.url;
                const urlParams = new URLSearchParams(url.split('?')[1]);
                urlParams.delete('t');
                setTimeout(() => {
                  inputRef.current!.value = url.split('?')[0] + '?' + urlParams.toString();
                  inputRef.current?.focus();
                });
              }}
            >
              <IconEdit size={20} color="#999"></IconEdit>
            </div>
            <div
              style={{ cursor: 'pointer', marginLeft: '5px' }}
              onClick={async () => {
                setLoading(true);
                const url = state.url;
                const urlParams = new URLSearchParams(url.split('?')[1]);
                urlParams.set('t', Date.now() + '');
                const newUrl = url.split('?')[0] + '?' + urlParams.toString();
                setState({ ...state, url: newUrl });
              }}
            >
              <IconRefresh size={20} color="#999"></IconRefresh>
            </div>
          </div>
          <iframe
            ref={iframeRef}
            // src="https://bs-datar-lark-base.replit.app/chart?id=4OPdiyIflDEp4aq2eh-2T"
            // src="http://localhost:3000/chart?id=dSzlHkdab1A4ctTAGvHx-"
            // src="http://localhost:3000/chart?id=WR37JnEfhF13L75ApS0sd"
            src={state.url}
            style={{ width: '100vw', height: height + 'px', padding: 0, border: 0 }}
            onLoad={(e) => {
              setLoading(true);
            }}
          ></iframe>
        </>
      ) : (
        <input
          ref={inputRef}
          className="input-box"
          type="text"
          placeholder="https://..."
          value={state.url}
          onInput={(e: any) => {
            setState({ ...state, url: e.target.value });
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              saveState();
            }
          }}
          onBlur={saveState}
        />
      )}
    </div>
  );
};
