import { createDropzone } from '@solid-primitives/upload';
import { For, createEffect, createSignal } from 'solid-js';
import { UploadCard, sekaiHistory, sekaiValue } from './uploadcard.component';
import createLocalStore from '@solid-primitives/local-store';
import { humanFileSize } from '../libs/utils';

(window as unknown as {
  uploadLimit: number;
}).uploadLimit = 1024 * 1024 * 1024;

export const Upload = () => {
  const [value, setValue] = createLocalStore('s3kai');
  const [isDraging, setIsDraging] = createSignal(false);
  const [processCard, setProcessCard] = createSignal([]);
  const [currentExpire, setCurrentExpire] = createSignal(
    JSON.parse((value as any).expire || 3600),
  );
  const currentArray = JSON.parse((value as any).history || '[]');
  const newHistory = currentArray.filter((h: sekaiHistory) => {
    if (!new Date(h.exp).getTime() || (h.exp instanceof Date ? h.exp.getTime() : new Date(h.exp).getTime()) < new Date().getTime()) return false;
    return true;
  });
  setValue('history', JSON.stringify(newHistory));
  const [finishedCard, setFinishedCard] = createSignal(newHistory);

  const onUploadFile = (files: File[]) => {
    setProcessCard(processCard().concat(files as any));
  };

  const { setRef: dropzoneRef } = createDropzone({
    onDrop: async (files) => {
      setIsDraging(false);
      onUploadFile(files.map((f) => f.file).slice(0, 5));
    },
    onDragEnter: () => {
      setIsDraging(true);
    },
    onDragLeave: () => {
      setIsDraging(false);
    },
  });


  createEffect(() => {
    setValue('expire', currentExpire());
  }, [currentExpire()])

  return (
    <>
      <main>
        <div
          ref={dropzoneRef}
          class={`${isDraging() ? 'z-50 opacity-100' : 'z-30 opacity-0'
            } duration-200 w-screen h-screen fixed flex items-center justify-center bg-black bg-opacity-80`}
        >
          <h1 class="text-3xl md:text-6xl text-white font-bold">
            Drag here to upload
          </h1>
          <input
            type="file"
            title="Click to pick and upload"
            onChange={(e: any) => onUploadFile(Array.from(e.target.files))}
            class="absolute w-full h-full opacity-0"
          />
        </div>
        <div class="absolute top-0 text-white p-6 w-full">
          <div class="text-6xl font-bold italic w-fit">
            S3KAI
            <span class="ml-2 text-sm font-normal">(up.s3k.ai)</span>
          </div>
          <div class="text-lg p-4">
            <p>Welcome to s3kai up</p>
            <p class="mb-2">
              <span class="hidden md:inline">Drag 'and drop or click</span>
              <span class="inline md:hidden">Touch</span> anywhere to upload
            </p>
            <div class="hidden md:block">
              <p>
                ShareX:{' '}
                <a
                  href="https://s3k.ai/f/406os.sxcu"
                  target="_blank"
                  class="underline absolute z-40 ml-2"
                >
                  Click here
                </a>
              </p>
            </div>
            <p>Temporary uploads up to 1GiB are allowed</p>
            <div class="hidden md:block mt-4">
              <p>
                Need more than 15 days?
                <br />
                Check out m1rai for long time storage:{' '}
                <a
                  href="https://up.m1r.ai"
                  target="_blank"
                  class="underline absolute z-40 ml-2"
                >
                  Click here
                </a>
              </p>
            </div>
          </div>
          <div class="px-4 py-2 z-40 absolute">
            <p>Expire after</p>
            <div class="mt-2">
              <button class={`border rounded cursor-pointer border-white p-1 mr-2 hover:bg-white hover:text-black ${currentExpire() == 3600 ? 'bg-white text-black' : ''}`} onClick={() => {
                setCurrentExpire(3600)
              }}>1 Hour</button>
              <button class={`border rounded cursor-pointer border-white p-1 mr-2 hover:bg-white hover:text-black ${currentExpire() == 10800 ? 'bg-white text-black' : ''}`} onClick={() => {
                setCurrentExpire(10800)
              }}>3 Hours</button>
              <button class={`border rounded cursor-pointer border-white p-1 mr-2 hover:bg-white hover:text-black ${currentExpire() == 32400 ? 'bg-white text-black' : ''}`} onClick={() => {
                setCurrentExpire(32400)
              }}>6 Hours</button>
              <button class={`border rounded cursor-pointer border-white p-1 mr-2 hover:bg-white hover:text-black ${currentExpire() == 86400 ? 'bg-white text-black' : ''}`} onClick={() => {
                setCurrentExpire(86400)
              }}>1 Day</button>
              <button class={`border rounded cursor-pointer border-white p-1 mr-2 hover:bg-white hover:text-black ${currentExpire() == 86400 * 3 ? 'bg-white text-black' : ''}`} onClick={() => {
                setCurrentExpire(86400 * 3)
              }}>3 Days</button>
              <button class={`border rounded cursor-pointer border-white p-1 mr-2 hover:bg-white hover:text-black ${currentExpire() == 86400 * 7 ? 'bg-white text-black' : ''}`} onClick={() => {
                setCurrentExpire(86400 * 7)
              }}>7 Days</button>
              <button class={`border rounded cursor-pointer border-white p-1 mr-2 hover:bg-white hover:text-black ${currentExpire() == ((86400 * 15) - 10) ? 'bg-white text-black' : ''}`} onClick={() => {
                setCurrentExpire((86400 * 15) - 10)
              }}>15 Days</button>
            </div>
          </div>
          <div class="px-4 py-2 mt-24">
            {(value as sekaiValue)?.history &&
              JSON.parse((value as any)?.history)?.length > 0 &&
              'History'}
          </div>
          <div class="grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] p-2 gap-3">
            <For each={processCard().reverse()}>
              {(data, i) => (
                <UploadCard file={data} preData={null} isUploaded={false} />
              )}
            </For>
            <For each={finishedCard().reverse()}>
              {(data: sekaiHistory, i) => (
                <UploadCard file={null} preData={data} isUploaded={true} />
              )}
            </For>
          </div>
        </div>
      </main>
      <div class="w-screen h-screen fixed bg-a overflow-hidden -z-40">
      </div>
    </>
  );
};
