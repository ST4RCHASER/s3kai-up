import { createEffect, createSignal } from 'solid-js';
import axios from 'axios';
import { humanFileSize } from '../libs/utils';
import createLocalStore from '@solid-primitives/local-store';

export interface sekaiHistory {
  name: string;
  url: string;
  size: number;
  date: Date;
  exp: Date | number;
}
export interface sekaiValue {
  history: sekaiHistory[];
}

export const UploadCard = ({
  file,
  isUploaded,
  preData,
}: {
  file: File | null;
  isUploaded: boolean;
  preData: sekaiHistory | null;
}) => {
  const [copyState, setCopyState] = createSignal(false);
  const [progess, setProgress] = createSignal(0);
  const [progessData, setProgressData] = createSignal('0/0');
  const [errorMessage, setErrorMessage] = createSignal('');
  const [isOK, setIsOK] = createSignal(isUploaded);
  const [showCompleteText, setShowCompleteText] = createSignal(false);
  const [value, setValue] = createLocalStore('s3kai');
  if (!(value as any)?.history) setValue('history', JSON.stringify([]));
  const [displayData, setDisplayData] = createSignal(
    preData || {
      name: 'Unknown file name',
      url: '',
      size: 0,
      date: new Date(),
      exp: new Date(),
    },
  );
  const UPLOAD_ENDPOINT = 'https://up.s3k.ai/upload';
  //1GB
  const DEFAULT_LIMIT_SIZE = 1024 * 1024 * 1024
  let timer: NodeJS.Timer;

  createEffect(() => {
    if (file) {
      if (file.size >= DEFAULT_LIMIT_SIZE) {
        setErrorMessage(`This file size is over ${humanFileSize(DEFAULT_LIMIT_SIZE)}`);
        return;
      }
      const bodyFormData = new FormData();
      bodyFormData.append('file', file);
      bodyFormData.append('expire', (value as any).expire);
      axios
        .request({
          method: 'post',
          url: UPLOAD_ENDPOINT,
          data: bodyFormData,
          onUploadProgress: (p) => {
            setProgress(Math.round((p.progress || 0) * 100));
            setProgressData(
              `${humanFileSize(p.loaded)} / ${humanFileSize(p.total || 0)}`,
            );
          },
        })
        .then((data) => {
          setProgress(0);
          setIsOK(true);
          const res = {
            name: file.name,
            url: data.data.url,
            size: file.size,
            date: displayData().date,
            exp: new Date(data.data.expireAt),
          };
          setDisplayData(res);

          // Add to history
          const newArray = JSON.parse((value as any).history);
          newArray.push(res);
          setValue('history', JSON.stringify(newArray));

          setShowCompleteText(true);
        })
        .catch((e) => {
          setErrorMessage(
            e?.response?.data?.message ||
            e?.response?.statusText ||
            e?.message ||
            e,
          );
          setIsOK(false);
        });
    }
  }, []);

  return (
    <div class="border rounded border-[#8ac5ac] cursor-pointer relative">
      {showCompleteText() && (
        <div class="fixed -z-10 right-6 bottom-4 text-6xl opacity-0 text-white upload-text">
          UPLOAD COMPLETE
        </div>
      )}
      {isOK() && (
        <div
          onClick={(e) => {
            clearInterval(timer);
            navigator.clipboard.writeText(displayData().url).then(() => {
              setCopyState(true);
              timer = setTimeout(() => setCopyState(false), 1500);
            });
          }}
          class={`border-2 ${copyState() ? 'copy coped' : 'copy'
            } z-30 absolute w-full h-full flex justify-center items-center text-center bg-[#040c03] bg-opacity-80 opacity-0 hover:opacity-100 duration-200 rounded font-bold text-xl text-[${copyState() ? '#0aff0a' : '#00cb00'
            }]`}
        >
          {copyState() ? 'COPIED!' : 'CLICK TO COPY'}
        </div>
      )}
      <div
        style={{
          width: `${progess()}%`,
          'background-color':
            progess() < 100
              ? 'rgba(0, 255, 0, 0.3)'
              : errorMessage()
                ? 'rgba(255, 0, 0, 0.3)'
                : 'rgba(255, 255, 0, 0.3)',
        }}
        class="h-full duration-200 transition-all absolute bg-opacity-30 -z-10"
      />
      {isOK() && displayData().name.match(/\.(jpeg|jpg|gif|png|svg)$/i) && (
        <img
          src={displayData().url}
          class="aspect-video object-cover"
          alt="Preview Image"
        />
      )}
      <div
        class={`p-3 transition-all ${isOK() &&
          displayData().name.match(/\.(jpeg|jpg|gif|png|svg)$/i) &&
          '!pt-2'
          }`}
      >
        <div class="font-bold text-ellipsis overflow-hidden w-full">
          {isOK() ? displayData().name : file?.name || displayData().name}
        </div>
        <div class="text-xs overflow-hidden text-ellipsis w-full">
          DATE: {displayData().date.toLocaleString()}
        </div>
        <div class="text-xs overflow-hidden text-ellipsis w-full">
          EXP: {displayData().exp ? isNaN(+displayData().exp) ? displayData().exp.toLocaleString() : new Date(+displayData().exp).toLocaleString() : 'Never'}
        </div>
        <div
          class={`${errorMessage() && 'text-red-500 font-bold'
            } text-xs overflow-hidden text-ellipsis w-full`}
        >
          {isOK() ? (
            humanFileSize(displayData().size)
          ) : errorMessage() ? (
            errorMessage()
          ) : (
            <span>
              {progessData()} (
              {progess() == 100 ? 'Processing...' : progess() + '%'})
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
